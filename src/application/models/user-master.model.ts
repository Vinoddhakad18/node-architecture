import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';
import bcrypt from 'bcryptjs';

/**
 * UserMaster Model Attributes Interface
 */
export interface UserMasterAttributes {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  password: string;
  role: 'super_admin' | 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive' | 'deleted';
  last_login: Date | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * UserMaster Creation Attributes Interface
 * Fields that are optional during creation
 */
export interface UserMasterCreationAttributes
  extends Optional<
    UserMasterAttributes,
    'id' | 'mobile' | 'role' | 'status' | 'last_login' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'
  > {}

/**
 * UserMaster Model Class
 * Represents system user accounts
 */
export class UserMaster
  extends Model<UserMasterAttributes, UserMasterCreationAttributes>
  implements UserMasterAttributes
{
  public id!: number;
  public name!: string;
  public email!: string;
  public mobile!: string | null;
  public password!: string;
  public role!: 'super_admin' | 'admin' | 'manager' | 'user';
  public status!: 'active' | 'inactive' | 'deleted';
  public last_login!: Date | null;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Check if user is active
   */
  public get isActive(): boolean {
    return this.getDataValue('status') === 'active';
  }

  /**
   * Compare password with hashed password
   */
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    const hashedPassword = this.getDataValue('password');
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  /**
   * Custom toJSON to exclude password from responses
   */
  public toJSON(): Omit<UserMasterAttributes, 'password'> {
    const values = { ...this.get() } as any;
    delete values.password;
    return values as Omit<UserMasterAttributes, 'password'>;
  }
}

/**
 * Initialize UserMaster Model
 */
UserMaster.init(
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
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    mobile: {
      type: DataTypes.STRING(15),
      allowNull: true,
      unique: true,
      validate: {
        is: /^[0-9+\-\s()]*$/i, // Basic phone number validation
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'manager', 'user'),
      allowNull: false,
      defaultValue: 'user',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'deleted'),
      allowNull: false,
      defaultValue: 'active',
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'user_master',
    modelName: 'UserMaster',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user: UserMaster) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: UserMaster) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default UserMaster;
