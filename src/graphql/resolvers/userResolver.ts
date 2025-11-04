import User from '@models/User';
import AuthService from '@services/AuthService';
import { GraphQLError } from 'graphql';
import logger from '@utils/logger';
import { Op } from 'sequelize';

interface Context {
  user?: User;
}

export const userResolvers = {
  Query: {
    getUser: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        if (!context.user) {
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const user = await User.findByPk(id, {
          attributes: { exclude: ['password', 'refreshToken'] }
        });

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        return user;
      } catch (error) {
        logger.error('GraphQL getUser error:', error);
        throw error;
      }
    },

    getUsers: async (
      _: any,
      {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      }: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: string;
      },
      context: Context
    ) => {
      try {
        if (!context.user || context.user.role !== 'admin') {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await User.findAndCountAll({
          limit,
          offset,
          order: [[sortBy, sortOrder]],
          attributes: { exclude: ['password', 'refreshToken'] }
        });

        return {
          users: rows,
          pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
          }
        };
      } catch (error) {
        logger.error('GraphQL getUsers error:', error);
        throw error;
      }
    },

    searchUsers: async (
      _: any,
      {
        query,
        page = 1,
        limit = 10
      }: { query: string; page?: number; limit?: number },
      context: Context
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await User.findAndCountAll({
          where: {
            [Op.or]: [
              { firstName: { [Op.like]: `%${query}%` } },
              { lastName: { [Op.like]: `%${query}%` } },
              { email: { [Op.like]: `%${query}%` } }
            ]
          },
          limit,
          offset,
          attributes: { exclude: ['password', 'refreshToken'] }
        });

        return {
          users: rows,
          pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
          }
        };
      } catch (error) {
        logger.error('GraphQL searchUsers error:', error);
        throw error;
      }
    },

    me: async (_: any, __: any, context: Context) => {
      try {
        if (!context.user) {
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        return context.user;
      } catch (error) {
        logger.error('GraphQL me error:', error);
        throw error;
      }
    }
  },

  Mutation: {
    register: async (
      _: any,
      {
        input
      }: {
        input: {
          email: string;
          password: string;
          firstName: string;
          lastName: string;
        };
      }
    ) => {
      try {
        const result = await AuthService.register(input);

        return {
          user: result.user.toJSON(),
          tokens: result.tokens
        };
      } catch (error) {
        logger.error('GraphQL register error:', error);
        throw new GraphQLError(
          error instanceof Error ? error.message : 'Registration failed',
          { extensions: { code: 'BAD_REQUEST' } }
        );
      }
    },

    login: async (
      _: any,
      { input }: { input: { email: string; password: string } }
    ) => {
      try {
        const result = await AuthService.login(input);

        return {
          user: result.user.toJSON(),
          tokens: result.tokens
        };
      } catch (error) {
        logger.error('GraphQL login error:', error);
        throw new GraphQLError(
          error instanceof Error ? error.message : 'Login failed',
          { extensions: { code: 'UNAUTHENTICATED' } }
        );
      }
    },

    createUser: async (
      _: any,
      {
        input
      }: {
        input: {
          email: string;
          password: string;
          firstName: string;
          lastName: string;
        };
      },
      context: Context
    ) => {
      try {
        if (!context.user || context.user.role !== 'admin') {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        const user = await User.create(input);

        return user.toJSON();
      } catch (error) {
        logger.error('GraphQL createUser error:', error);
        throw new GraphQLError(
          error instanceof Error ? error.message : 'User creation failed',
          { extensions: { code: 'BAD_REQUEST' } }
        );
      }
    },

    updateUser: async (
      _: any,
      {
        id,
        input
      }: {
        id: string;
        input: { firstName?: string; lastName?: string; email?: string };
      },
      context: Context
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const user = await User.findByPk(id);

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Check authorization
        if (context.user.role !== 'admin' && context.user.id !== id) {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        // Update user
        if (input.firstName) user.firstName = input.firstName;
        if (input.lastName) user.lastName = input.lastName;
        if (input.email) user.email = input.email;

        await user.save();

        return user.toJSON();
      } catch (error) {
        logger.error('GraphQL updateUser error:', error);
        throw error;
      }
    },

    deleteUser: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        if (!context.user || context.user.role !== 'admin') {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        const user = await User.findByPk(id);

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        await user.destroy();

        logger.info(`User deleted via GraphQL: ${user.email}`);

        return true;
      } catch (error) {
        logger.error('GraphQL deleteUser error:', error);
        throw error;
      }
    },

    toggleUserStatus: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        if (!context.user || context.user.role !== 'admin') {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        const user = await User.findByPk(id);

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        user.isActive = !user.isActive;
        await user.save();

        return user.toJSON();
      } catch (error) {
        logger.error('GraphQL toggleUserStatus error:', error);
        throw error;
      }
    }
  }
};
