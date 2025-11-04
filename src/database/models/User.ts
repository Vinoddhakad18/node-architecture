import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@database/index';
import bcrypt from 'bcrypt';

// User attributes interface
export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'moderator';
  isActive: boolean;
  isVerified: boolean;
  lastLogin: Date | null;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Creation attributes (optional fields during creation)
export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'role' | 'isActive' | 'isVerified' | 'lastLogin' | 'refreshToken' | 'createdAt' | 'updatedAt'> {}

// User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: 'admin' | 'user' | 'moderator';
  public isActive!: boolean;
  public isVerified!: boolean;
  public lastLogin!: Date | null;
  public refreshToken!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  public toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() };
    delete (values as any).password;
    delete (values as any).refreshToken;
    return values;
  }
}

// Initialize model
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name'
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'moderator'),
      defaultValue: 'user',
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_verified'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'refresh_token'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

export default User;
