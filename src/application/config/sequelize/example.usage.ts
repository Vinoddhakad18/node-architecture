/**
 * Example Usage of Sequelize Database Configuration
 *
 * This file demonstrates how to use the Sequelize configuration in your application.
 * Delete this file once you understand how to use the configuration.
 */

import { sequelize, testConnection, syncDatabase, closeConnection } from './database';
import { DataTypes, Model } from 'sequelize';

/**
 * Example 1: Test Database Connection
 */
export const exampleTestConnection = async () => {
  try {
    await testConnection();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

/**
 * Example 2: Define a Model
 */
class User extends Model {
  public id!: number;
  public username!: string;
  public email!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
  },
  {
    sequelize, // Pass the sequelize instance
    tableName: 'users',
    modelName: 'User',
  }
);

/**
 * Example 3: Sync Models with Database
 * WARNING: Use { force: true } only in development - it will drop tables!
 */
export const exampleSyncModels = async () => {
  try {
    // Sync without dropping tables
    await syncDatabase();

    // Or sync with alter (updates table structure without dropping)
    // await syncDatabase({ alter: true });

    // DANGER: Force sync (drops and recreates tables)
    // await syncDatabase({ force: true });
  } catch (error) {
    console.error('Failed to sync models:', error);
  }
};

/**
 * Example 4: Perform Database Operations
 */
export const exampleDatabaseOperations = async () => {
  try {
    // Create a new user
    const newUser = await User.create({
      username: 'john_doe',
      email: 'john@example.com',
    });
    console.log('User created:', newUser.toJSON());

    // Find a user
    const user = await User.findOne({ where: { username: 'john_doe' } });
    console.log('User found:', user?.toJSON());

    // Update a user
    await User.update(
      { email: 'john.doe@example.com' },
      { where: { username: 'john_doe' } }
    );

    // Delete a user
    await User.destroy({ where: { username: 'john_doe' } });
  } catch (error) {
    console.error('Database operation failed:', error);
  }
};

/**
 * Example 5: Use Transactions
 */
export const exampleTransaction = async () => {
  const t = await sequelize.transaction();

  try {
    const user = await User.create(
      {
        username: 'jane_doe',
        email: 'jane@example.com',
      },
      { transaction: t }
    );

    // If everything is successful, commit the transaction
    await t.commit();
    console.log('Transaction committed:', user.toJSON());
  } catch (error) {
    // If there's an error, rollback the transaction
    await t.rollback();
    console.error('Transaction rolled back:', error);
  }
};

/**
 * Example 6: Raw Queries
 */
export const exampleRawQuery = async () => {
  try {
    const [results] = await sequelize.query(
      'SELECT * FROM users WHERE username = ?',
      {
        replacements: ['john_doe'],
      }
    );
    console.log('Query results:', results);
  } catch (error) {
    console.error('Query failed:', error);
  }
};

/**
 * Example 7: Close Connection Gracefully
 */
export const exampleCloseConnection = async () => {
  try {
    await closeConnection();
  } catch (error) {
    console.error('Failed to close connection:', error);
  }
};

/**
 * Example 8: Usage in Server Startup
 */
export const initializeDatabase = async () => {
  try {
    // Test connection
    await testConnection();

    // Sync models (be careful with this in production)
    if (process.env.NODE_ENV !== 'production') {
      await syncDatabase({ alter: true });
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// Export the User model for use in other parts of the application
export { User };
