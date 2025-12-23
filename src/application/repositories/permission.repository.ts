import Permission, {
  PermissionAttributes,
  PermissionCreationAttributes,
} from '@models/permission.model';
import { FindOptions, WhereOptions } from 'sequelize';

import { BaseRepository } from './base.repository';

/**
 * Permission Repository
 * Data access layer for permission operations
 */
export class PermissionRepository extends BaseRepository<
  Permission,
  PermissionAttributes,
  PermissionCreationAttributes
> {
  constructor() {
    super(Permission);
  }

  /**
   * Find permission by key
   */
  async findByKey(key: string): Promise<Permission | null> {
    return this.findOne({
      where: { key },
    });
  }

  /**
   * Find all permissions by keys
   */
  async findByKeys(keys: string[]): Promise<Permission[]> {
    return this.findAll({
      where: {
        key: keys,
      } as WhereOptions<PermissionAttributes>,
    });
  }

  /**
   * Check if permission key exists
   */
  async isKeyExists(key: string, excludeId?: number): Promise<boolean> {
    const where: WhereOptions<PermissionAttributes> = { key };
    return this.exists({ where });
  }
}

// Export singleton instance
export const permissionRepository = new PermissionRepository();
export default permissionRepository;
