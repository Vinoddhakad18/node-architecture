/**
 * Example Usage of Sequelize Database Configuration
 *
 * This file demonstrates how to use the Sequelize configuration in your application.
 * Delete this file once you understand how to use the configuration.
 */

import { sequelize, testConnection, syncDatabase, closeConnection } from './database';
import { DataTypes, Model, Op, QueryTypes } from 'sequelize';

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

/**
 * Example 9: Read/Write Replication Usage
 *
 * To enable replication, set these environment variables:
 * DB_REPLICATION=true
 * DB_WRITE_HOST=mysql-master
 * DB_WRITE_PORT=3306
 * DB_READ_HOSTS=mysql-replica-1,mysql-replica-2
 * DB_READ_PORTS=3306,3306
 */
export const exampleReplication = async () => {
  try {
    // READ OPERATIONS (automatically go to read replicas)
    // Sequelize automatically load-balances reads across replicas using round-robin

    // Example: Find all users (uses read replica)
    const users = await User.findAll();
    console.log('Users from read replica:', users.length);

    // Example: Find by primary key (uses read replica)
    const user = await User.findByPk(1);
    console.log('User from read replica:', user?.toJSON());

    // Example: Complex query (uses read replica)
    const activeUsers = await User.findAll({
      where: { email: { [Op.like]: '%@example.com' } },
      limit: 10,
    });
    console.log('Active users from read replica:', activeUsers.length);

    // WRITE OPERATIONS (automatically go to write master)

    // Example: Create user (uses write master)
    const newUser = await User.create({
      username: 'alice',
      email: 'alice@example.com',
    });
    console.log('User created on write master:', newUser.toJSON());

    // Example: Update user (uses write master)
    await User.update(
      { email: 'alice.updated@example.com' },
      { where: { username: 'alice' } }
    );

    // Example: Delete user (uses write master)
    await User.destroy({ where: { username: 'alice' } });

    // FORCE READ FROM MASTER
    // Use this when you need the most up-to-date data (e.g., after a write)

    // Example: Force read from master to avoid replication lag
    const latestUser = await User.findByPk(1, { useMaster: true });
    console.log('User from write master:', latestUser?.toJSON());

    // TRANSACTIONS (always use write master)
    // All queries in a transaction automatically go to the write master

    const t = await sequelize.transaction();
    try {
      // All these queries will use the write master
      const userInTransaction = await User.findByPk(1, { transaction: t });
      console.log('User in transaction:', userInTransaction?.toJSON());
      await User.create(
        { username: 'bob', email: 'bob@example.com' },
        { transaction: t }
      );
      await User.update(
        { email: 'updated@example.com' },
        { where: { id: 1 }, transaction: t }
      );

      await t.commit();
      console.log('Transaction committed on write master');
    } catch (error) {
      await t.rollback();
      console.error('Transaction rolled back:', error);
    }

    // RAW QUERIES WITH REPLICATION
    // Specify query type to control routing

    // Read query (uses read replica)
    const [readResults] = await sequelize.query('SELECT * FROM users LIMIT 10', {
      type: QueryTypes.SELECT,
    });
    console.log('Read query results from replica:', readResults);

    // Write query (uses write master)
    await sequelize.query(
      "INSERT INTO users (username, email) VALUES ('charlie', 'charlie@example.com')",
      { type: QueryTypes.INSERT }
    );

    // Force query to use master
    const [masterResults] = await sequelize.query('SELECT * FROM users WHERE id = ?', {
      replacements: [1],
      type: QueryTypes.SELECT,
      useMaster: true,
    });
    console.log('Master query results:', masterResults);

    console.log('Replication examples completed successfully');
  } catch (error) {
    console.error('Replication example failed:', error);
  }
};

/**
 * Example 10: Monitoring Replication Health
 *
 * Example showing how to check connection pool stats
 */
export const exampleMonitorReplication = async () => {
  try {
    // Get connection pool statistics
    const connectionManager = sequelize.connectionManager;
    console.log('Connection Manager:', typeof connectionManager);

    // Test connectivity to all hosts
    await testConnection();

    // You can also check specific pool stats
    if (sequelize.config.replication) {
      console.log('Replication is enabled');
      console.log('Write host:', sequelize.config.replication.write);
      console.log('Read hosts:', sequelize.config.replication.read);
    } else {
      console.log('Replication is disabled');
      console.log('Single host:', sequelize.config.host);
    }
  } catch (error) {
    console.error('Error monitoring replication:', error);
  }
};

// Export the User model for use in other parts of the application
export { User };
