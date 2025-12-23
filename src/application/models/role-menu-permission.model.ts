import { sequelize } from '@config/database';
import Role from '@models/role.model';
import Menu from '@models/menu.model';
import { DataTypes, Model, Optional } from 'sequelize';

/**
 * Role Menu Permission Model Attributes Interface
 */
export interface RoleMenuPermissionAttributes {
  id: number;
  role_id: number;
  menu_id: number;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_status: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Role Menu Permission Creation Attributes Interface
 * Fields that are optional during creation
 */
export type RoleMenuPermissionCreationAttributes = Optional<
  RoleMenuPermissionAttributes,
  | 'id'
  | 'can_view'
  | 'can_add'
  | 'can_edit'
  | 'can_delete'
  | 'can_export'
  | 'can_status'
  | 'created_at'
  | 'updated_at'
>;

/**
 * Role Menu Permission Model Class
 * Represents permission flags per role + menu combination
 */
export class RoleMenuPermission
  extends Model<RoleMenuPermissionAttributes, RoleMenuPermissionCreationAttributes>
  implements RoleMenuPermissionAttributes
{
  public id!: number;
  public role_id!: number;
  public menu_id!: number;
  public can_view!: boolean;
  public can_add!: boolean;
  public can_edit!: boolean;
  public can_delete!: boolean;
  public can_export!: boolean;
  public can_status!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public role?: Role;
  public menu?: Menu;
}

/**
 * Initialize Role Menu Permission Model
 */
RoleMenuPermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    menu_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'menus',
        key: 'id',
      },
    },
    can_view: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    can_add: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    can_edit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    can_delete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    can_export: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    can_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: 'role_menu_permissions',
    modelName: 'RoleMenuPermission',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Define associations
RoleMenuPermission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
RoleMenuPermission.belongsTo(Menu, { foreignKey: 'menu_id', as: 'menu' });

export default RoleMenuPermission;
