import { Op, FindOptions, WhereOptions } from 'sequelize';
import { BaseRepository } from './base.repository';
import UserMaster, {
  UserMasterAttributes,
  UserMasterCreationAttributes,
} from '@models/user-master.model';
import { UserStatus } from '@application/constants';

/**
 * User Repository
 * Data access layer for user operations
 */
export class UserRepository extends BaseRepository<
  UserMaster,
  UserMasterAttributes,
  UserMasterCreationAttributes
> {
  constructor() {
    super(UserMaster);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserMaster | null> {
    return this.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Find user by email with password (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<UserMaster | null> {
    return this.model.findOne({
      where: { email: email.toLowerCase() },
      attributes: { include: ['password'] },
    });
  }

  /**
   * Find user by mobile
   */
  async findByMobile(mobile: string): Promise<UserMaster | null> {
    return this.findOne({
      where: { mobile },
    });
  }

  /**
   * Find active users
   */
  async findAllActive(options?: FindOptions): Promise<UserMaster[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<UserMasterAttributes>),
        status: UserStatus.ACTIVE,
      } as WhereOptions<UserMasterAttributes>,
    });
  }

  /**
   * Find users by role
   */
  async findByRole(role: string, options?: FindOptions): Promise<UserMaster[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<UserMasterAttributes>),
        role,
      } as WhereOptions<UserMasterAttributes>,
    });
  }

  /**
   * Check if email exists
   */
  async isEmailExists(email: string, excludeId?: number): Promise<boolean> {
    const where: WhereOptions<UserMasterAttributes> = { email: email.toLowerCase() };
    if (excludeId) {
      (where as Record<string, unknown>).id = { [Op.ne]: excludeId };
    }
    return this.exists({ where });
  }

  /**
   * Check if mobile exists
   */
  async isMobileExists(mobile: string, excludeId?: number): Promise<boolean> {
    const where: WhereOptions<UserMasterAttributes> = { mobile };
    if (excludeId) {
      (where as Record<string, unknown>).id = { [Op.ne]: excludeId };
    }
    return this.exists({ where });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: number): Promise<void> {
    await this.model.update(
      { last_login: new Date() },
      { where: { id: userId } }
    );
  }

  /**
   * Soft delete user (set status to deleted)
   */
  async softDelete(id: number, updatedBy?: number): Promise<boolean> {
    const result = await this.update(id, {
      status: UserStatus.DELETED,
      updated_by: updatedBy,
    } as Partial<UserMasterAttributes>);
    return result !== null;
  }

  /**
   * Deactivate user
   */
  async deactivate(id: number, updatedBy?: number): Promise<boolean> {
    const result = await this.update(id, {
      status: UserStatus.INACTIVE,
      updated_by: updatedBy,
    } as Partial<UserMasterAttributes>);
    return result !== null;
  }

  /**
   * Activate user
   */
  async activate(id: number, updatedBy?: number): Promise<boolean> {
    const result = await this.update(id, {
      status: UserStatus.ACTIVE,
      updated_by: updatedBy,
    } as Partial<UserMasterAttributes>);
    return result !== null;
  }

  /**
   * Search users by name or email
   */
  async search(query: string, options?: FindOptions): Promise<UserMaster[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<UserMasterAttributes>),
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
        ],
      } as WhereOptions<UserMasterAttributes>,
    });
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
export default userRepository;
