import { sequelize } from '@config/database';
import { DataTypes, Model, Optional } from 'sequelize';

/**
 * Menu Model Attributes Interface
 */
export interface MenuAttributes {
  id: number;
  name: string;
  route: string;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Menu Creation Attributes Interface
 * Fields that are optional during creation
 */
export type MenuCreationAttributes = Optional<
  MenuAttributes,
  'id' | 'parent_id' | 'sort_order' | 'is_active' | 'created_at' | 'updated_at'
>;

/**
 * Menu Model Class
 * Represents navigation menu items with hierarchical structure
 */
export class Menu extends Model<MenuAttributes, MenuCreationAttributes> implements MenuAttributes {
  public id!: number;
  public name!: string;
  public route!: string;
  public parent_id!: number | null;
  public sort_order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public parent?: Menu;
  public children?: Menu[];

  /**
   * Check if menu is active
   */
  public get isActive(): boolean {
    return this.getDataValue('is_active') === true;
  }

  /**
   * Check if menu is a root menu (no parent)
   */
  public get isRoot(): boolean {
    return this.getDataValue('parent_id') === null;
  }
}

/**
 * Initialize Menu Model
 */
Menu.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    route: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'menus',
        key: 'id',
      },
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'menus',
    modelName: 'Menu',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Self-referencing associations for hierarchical structure
Menu.belongsTo(Menu, { as: 'parent', foreignKey: 'parent_id' });
Menu.hasMany(Menu, { as: 'children', foreignKey: 'parent_id' });

export default Menu;
