import { sequelize } from '@config/database';
import { DataTypes, Model, Optional } from 'sequelize';

/**
 * Permission Model Attributes Interface
 */
export interface PermissionAttributes {
  id: number;
  key: string;
  label: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Permission Creation Attributes Interface
 * Fields that are optional during creation
 */
export type PermissionCreationAttributes = Optional<
  PermissionAttributes,
  'id' | 'created_at' | 'updated_at'
>;

/**
 * Permission Model Class
 * Represents individual permission actions
 */
export class Permission extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes {
  public id!: number;
  public key!: string;
  public label!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

/**
 * Initialize Permission Model
 */
Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Permission key cannot be empty',
        },
        len: {
          args: [1, 50],
          msg: 'Permission key must be between 1 and 50 characters',
        },
      },
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Permission label cannot be empty',
        },
        len: {
          args: [1, 100],
          msg: 'Permission label must be between 1 and 100 characters',
        },
      },
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
    tableName: 'permissions',
    modelName: 'Permission',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Permission;

