import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@config/sequelize';

/**
 * CountryMaster Model Attributes Interface
 */
export interface CountryMasterAttributes {
  id: number;
  name: string;
  code: string;
  currency_code: string | null;
  status: 'active' | 'inactive';
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * CountryMaster Creation Attributes Interface
 * Fields that are optional during creation
 */
export interface CountryMasterCreationAttributes
  extends Optional<
    CountryMasterAttributes,
    'id' | 'currency_code' | 'status' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'
  > {}

/**
 * CountryMaster Model Class
 * Represents country reference data
 */
export class CountryMaster
  extends Model<CountryMasterAttributes, CountryMasterCreationAttributes>
  implements CountryMasterAttributes
{
  public id!: number;
  public name!: string;
  public code!: string;
  public currency_code!: string | null;
  public status!: 'active' | 'inactive';
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Check if country is active
   */
  public get isActive(): boolean {
    return this.getDataValue('status') === 'active';
  }
}

/**
 * Initialize CountryMaster Model
 */
CountryMaster.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(3),
      allowNull: false,
      unique: true,
      comment: 'ISO 3166-1 alpha-2 or alpha-3 country code',
    },
    currency_code: {
      type: DataTypes.STRING(3),
      allowNull: true,
      comment: 'ISO 4217 currency code',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'country_master',
    modelName: 'CountryMaster',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default CountryMaster;
