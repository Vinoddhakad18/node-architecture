import { sequelize } from '@config/database';
import { DataTypes, Model, Optional } from 'sequelize';

/**
 * Role Model Attributes Interface
 */
export interface RoleAttributes {
  id: number;
  name: string;
  description: string | null;
  status: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Role Creation Attributes Interface
 * Fields that are optional during creation
 */
export type RoleCreationAttributes = Optional<
  RoleAttributes,
  'id' | 'description' | 'status' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'
>;

/**
 * Role Model Class
 * Represents role definitions for RBAC
 */
export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public status!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Check if role is active
   */
  public get isActive(): boolean {
    return this.getDataValue('status') === true;
  }
}

/**
 * Initialize Role Model
 */
Role.init(
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
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Role name cannot be empty',
        },
        len: {
          args: [1, 100],
          msg: 'Role name must be between 1 and 100 characters',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'true = active, false = inactive',
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
      field: 'created_at',
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'roles',
    modelName: 'Role',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Role;

