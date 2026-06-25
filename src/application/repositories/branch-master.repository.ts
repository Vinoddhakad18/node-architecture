'use strict';

import BranchMaster, {
  BranchMasterAttributes,
  BranchMasterCreationAttributes,
} from '@models/branch-master.model';
import { Op, FindOptions, WhereOptions } from 'sequelize';
import { BaseRepository } from './base.repository';

/**
 * BranchMaster Repository
 */
export class BranchMasterRepository extends BaseRepository<
  BranchMaster,
  BranchMasterAttributes,
  BranchMasterCreationAttributes
> {
  constructor() {
    super(BranchMaster);
  }

  async findByBranchCode(branch_code: string): Promise<BranchMaster | null> {
    return this.findOne({
      where: { branch_code: branch_code.toUpperCase() },
    });
  }

  async findAllActive(options?: FindOptions): Promise<BranchMaster[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<BranchMasterAttributes>),
        status: 'active',
      } as WhereOptions<BranchMasterAttributes>,
      order: [['branch_name', 'ASC']],
    });
  }

  async isBranchCodeExists(branch_code: string, excludeId?: number): Promise<boolean> {
    const where: WhereOptions<BranchMasterAttributes> = {
      branch_code: branch_code.toUpperCase(),
    };
    if (excludeId) {
      (where as Record<string, unknown>).id = { [Op.ne]: excludeId };
    }
    return this.exists({ where });
  }

  async search(query: string, options?: FindOptions): Promise<BranchMaster[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<BranchMasterAttributes>),
        [Op.or]: [
          { branch_name: { [Op.like]: `%${query}%` } },
          { branch_code: { [Op.like]: `%${query}%` } },
        ],
      } as WhereOptions<BranchMasterAttributes>,
    });
  }

  async softDelete(id: number, updatedBy?: number): Promise<boolean> {
    const result = await this.update(id, {
      status: 'inactive',
      updated_by: updatedBy,
    } as Partial<BranchMasterAttributes>);
    return result !== null;
  }

  async activate(id: number, updatedBy?: number): Promise<boolean> {
    const result = await this.update(id, {
      status: 'active',
      updated_by: updatedBy,
    } as Partial<BranchMasterAttributes>);
    return result !== null;
  }

  async findWithFilters(
    page = 1,
    limit = 10,
    search?: string,
    status?: 'active' | 'inactive',
    sortBy = 'branch_name',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Promise<{ rows: BranchMaster[]; count: number }> {
    const offset = (page - 1) * limit;
    const where: WhereOptions<BranchMasterAttributes> = {};

    if (search) {
      Object.assign(where, {
        [Op.or]: [
          { branch_name: { [Op.like]: `%${search}%` } },
          { branch_code: { [Op.like]: `%${search}%` } },
        ],
      });
    }

    if (status) {
      Object.assign(where, { status });
    }

    return this.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }
}

export const branchMasterRepository = new BranchMasterRepository();
export default branchMasterRepository;
