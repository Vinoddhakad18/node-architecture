'use strict';

import { sequelize } from '@config/database';
import { DataTypes, Model, Optional } from 'sequelize';

/**
 * BranchMaster Model Attributes Interface
 */
export interface BranchMasterAttributes {
  id: number;
  branch_name: string;
  branch_code: string;
  address: string | null;
  status: 'active' | 'inactive';
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * BranchMaster Creation Attributes Interface
 */
export type BranchMasterCreationAttributes = Optional<
  BranchMasterAttributes,
  'id' | 'address' | 'status' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'
>;

/**
 * BranchMaster Model Class
 */
export class BranchMaster
  extends Model<BranchMasterAttributes, BranchMasterCreationAttributes>
  implements BranchMasterAttributes
{
  public id!: number;
  public branch_name!: string;
  public branch_code!: string;
  public address!: string | null;
  public status!: 'active' | 'inactive';
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public get isActive(): boolean {
    return this.getDataValue('status') === 'active';
  }
}

BranchMaster.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    branch_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Branch name cannot be empty',
        },
        len: {
          args: [1, 150],
          msg: 'Branch name must be between 1 and 150 characters',
        },
      },
    },
    branch_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Branch code cannot be empty',
        },
        len: {
          args: [1, 50],
          msg: 'Branch code must be between 1 and 50 characters',
        },
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'branch_masters',
    modelName: 'BranchMaster',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default BranchMaster;
