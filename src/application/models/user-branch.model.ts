'use strict';

import { sequelize } from '@config/database';
import { DataTypes, Model, Optional } from 'sequelize';

/**
 * UserBranch Junction Model Attributes Interface
 * Pivot table that enables a many-to-many relation between users and branches
 * (one user can be assigned to multiple branches and vice-versa)
 */
export interface UserBranchAttributes {
  id: number;
  user_id: number;
  branch_id: number;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * UserBranch Creation Attributes Interface
 */
export type UserBranchCreationAttributes = Optional<
  UserBranchAttributes,
  'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'
>;

/**
 * UserBranch Model Class
 * Represents the user_branches junction table
 */
export class UserBranch
  extends Model<UserBranchAttributes, UserBranchCreationAttributes>
  implements UserBranchAttributes
{
  declare id: number;
  declare user_id: number;
  declare branch_id: number;
  declare created_by: number | null;
  declare updated_by: number | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

UserBranch.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_master',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'branch_masters',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    tableName: 'user_branches',
    modelName: 'UserBranch',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'branch_id'],
        name: 'uniq_user_branches_user_branch',
      },
    ],
  }
);

export default UserBranch;
