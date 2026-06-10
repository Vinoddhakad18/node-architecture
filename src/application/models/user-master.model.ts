import { sequelize } from '@config/database';
import bcrypt from 'bcryptjs';
import {
  DataTypes,
  Model,
  Optional,
  BelongsToManyGetAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  BelongsToManyAddAssociationMixin,
} from 'sequelize';
import BranchMaster from './branch-master.model';
import Role from './role.model';
import UserBranch from './user-branch.model';

/**
 * UserMaster Model Attributes Interface
 */
export interface UserMasterAttributes {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  password: string;
  role_id: number | null;
  branch_id: number | null;
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
export type UserMasterCreationAttributes = Optional<
  UserMasterAttributes,
  | 'id'
  | 'mobile'
  | 'role_id'
  | 'branch_id'
  | 'status'
  | 'last_login'
  | 'created_by'
  | 'updated_by'
  | 'created_at'
  | 'updated_at'
>;

/**
 * UserMaster Model Class
 * Represents system user accounts
 */
export class UserMaster
  extends Model<UserMasterAttributes, UserMasterCreationAttributes>
  implements UserMasterAttributes
{
  declare id: number;
  declare name: string;
  declare email: string;
  declare mobile: string | null;
  declare password: string;
  declare role_id: number | null;
  declare branch_id: number | null;
  declare status: 'active' | 'inactive' | 'deleted';
  declare last_login: Date | null;
  declare created_by: number | null;
  declare updated_by: number | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare branch?: BranchMaster | null;
  declare role?: Role | null;

  // Many-to-many: branches assigned to this user.
  // These MUST use `declare` (not `public`): with target ES2022,
  // useDefineForClassFields defaults to true, so a real `public` field
  // would be initialized to undefined in the constructor and shadow the
  // association mixins Sequelize attaches to the prototype, causing
  // "setBranches is not a function" at runtime.
  declare branches?: BranchMaster[];
  declare getBranches: BelongsToManyGetAssociationsMixin<BranchMaster>;
  declare setBranches: BelongsToManySetAssociationsMixin<BranchMaster, number>;
  declare addBranch: BelongsToManyAddAssociationMixin<BranchMaster, number>;

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
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Role assigned to this user',
    },
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Branch ID for user assignment',
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

// Branch <-> User (optional primary branch): each user may reference one primary branch
UserMaster.belongsTo(BranchMaster, { foreignKey: 'branch_id', as: 'branch' });

// Branch <-> User (many-to-many): one user can be assigned to multiple branches
// and a branch can have many users, via the user_branches junction table
UserMaster.belongsToMany(BranchMaster, {
  through: UserBranch,
  foreignKey: 'user_id',
  otherKey: 'branch_id',
  as: 'branches',
});
BranchMaster.belongsToMany(UserMaster, {
  through: UserBranch,
  foreignKey: 'branch_id',
  otherKey: 'user_id',
  as: 'users',
});

// Role <-> User: one role has many users, each user belongs to one role
Role.hasMany(UserMaster, { foreignKey: 'role_id', as: 'users' });
UserMaster.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

export default UserMaster;
