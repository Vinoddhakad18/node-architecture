import {
  Model,
  ModelStatic,
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DestroyOptions,
  Transaction,
  CreationAttributes,
  WhereOptions,
} from 'sequelize';

/**
 * Base Repository Interface
 * Defines standard CRUD operations
 */
export interface IBaseRepository<T, CreateDTO, UpdateDTO> {
  findAll(options?: FindOptions): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  findOne(options: FindOptions): Promise<T | null>;
  create(data: CreateDTO, options?: CreateOptions): Promise<T>;
  update(id: number, data: UpdateDTO, options?: UpdateOptions): Promise<T | null>;
  delete(id: number, options?: DestroyOptions): Promise<boolean>;
  count(options?: FindOptions): Promise<number>;
}

/**
 * Base Repository
 * Abstract class implementing common database operations
 */
export abstract class BaseRepository<TModel extends Model, TAttributes, TCreationAttributes>
  implements IBaseRepository<TModel, TCreationAttributes, Partial<TAttributes>>
{
  protected model: ModelStatic<TModel>;

  constructor(model: ModelStatic<TModel>) {
    this.model = model;
  }

  /**
   * Find all records
   */
  async findAll(options?: FindOptions): Promise<TModel[]> {
    return this.model.findAll(options);
  }

  /**
   * Find record by ID
   */
  async findById(id: number): Promise<TModel | null> {
    return this.model.findByPk(id);
  }

  /**
   * Find one record matching criteria
   */
  async findOne(options: FindOptions): Promise<TModel | null> {
    return this.model.findOne(options);
  }

  /**
   * Create a new record
   */
  async create(data: TCreationAttributes, options?: CreateOptions): Promise<TModel> {
    return this.model.create(data as CreationAttributes<TModel>, options);
  }

  /**
   * Update a record by ID
   */
  async update(
    id: number,
    data: Partial<TAttributes>,
    options?: UpdateOptions
  ): Promise<TModel | null> {
    const record = await this.findById(id);
    if (!record) {
      return null;
    }
    await record.update(data as Partial<TModel>, options);
    return record;
  }

  /**
   * Delete a record by ID
   */
  async delete(id: number, options?: DestroyOptions): Promise<boolean> {
    const result = await this.model.destroy({
      where: { id } as unknown as WhereOptions<TAttributes>,
      ...options,
    });
    return result > 0;
  }

  /**
   * Count records
   */
  async count(options?: FindOptions): Promise<number> {
    return this.model.count(options);
  }

  /**
   * Find and count all records (for pagination)
   */
  async findAndCountAll(options?: FindOptions): Promise<{ rows: TModel[]; count: number }> {
    return this.model.findAndCountAll(options);
  }

  /**
   * Bulk create records
   */
  async bulkCreate(data: TCreationAttributes[], options?: CreateOptions): Promise<TModel[]> {
    return this.model.bulkCreate(data as CreationAttributes<TModel>[], options);
  }

  /**
   * Execute within a transaction
   */
  async withTransaction<R>(
    callback: (transaction: Transaction) => Promise<R>,
    transaction?: Transaction
  ): Promise<R> {
    if (transaction) {
      return callback(transaction);
    }

    const sequelize = this.model.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }

    return sequelize.transaction(callback);
  }

  /**
   * Check if record exists
   */
  async exists(options: FindOptions): Promise<boolean> {
    const count = await this.model.count(options);
    return count > 0;
  }
}
