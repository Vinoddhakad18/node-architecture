import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { Express, json } from 'express';
import cors from 'cors';
import { userTypeDefs } from './schema/userSchema';
import { userResolvers } from './resolvers/userResolver';
import { verifyAccessToken } from '@utils/jwt';
import User from '@models/User';
import logger from '@utils/logger';

// Combine all type definitions
const typeDefs = `#graphql
  ${userTypeDefs}

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

// Combine all resolvers
const resolvers = {
  Query: {
    ...userResolvers.Query
  },
  Mutation: {
    ...userResolvers.Mutation
  }
};

// Context function to add user to context
interface ContextValue {
  user?: User;
}

const getContext = async ({ req }: { req: any }): Promise<ContextValue> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {};
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return {};
    }

    return { user };
  } catch (error) {
    logger.error('GraphQL context error:', error);
    return {};
  }
};

// Create Apollo Server
export const createApolloServer = () => {
  return new ApolloServer<ContextValue>({
    typeDefs,
    resolvers,
    formatError: (error) => {
      logger.error('GraphQL Error:', error);
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        path: error.path
      };
    },
    introspection: process.env.NODE_ENV !== 'production'
  });
};

// Setup GraphQL endpoint
export const setupGraphQL = async (app: Express): Promise<void> => {
  const server = createApolloServer();
  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: getContext
    })
  );

  logger.info('GraphQL server configured at /graphql');
};
