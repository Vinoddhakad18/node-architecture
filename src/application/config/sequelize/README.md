# Sequelize Database Configuration

This directory contains the Sequelize ORM configuration for the Node.js application with TypeScript support and dynamic environment-based configuration.

## Files Created

- **database.ts** - Main Sequelize configuration with dynamic env values
- **index.ts** - Exports for easy importing
- **example.usage.ts** - Usage examples (can be deleted after understanding)
- **README.md** - This documentation file

## Features

### 1. Dynamic Configuration via Environment Variables
All database settings are configurable through environment files (.env, .env.development, .env.production).

### 2. Connection Pool Management
Optimized connection pooling for better performance:
- Configurable min/max connections
- Acquire and idle timeouts
- Automatic connection cleanup

### 3. Multiple Environment Support
- Development
- Production
- Test
- Custom environments

### 4. SSL Support
Production-ready SSL configuration for secure database connections.

### 5. Database Operations
Built-in utilities for:
- Testing connections
- Syncing models
- Closing connections gracefully

## Environment Variables

### Required Variables
```env
DB_HOST=localhost          # Database host
DB_PORT=3306              # Database port
DB_NAME=myapp             # Database name
DB_USER=appuser           # Database user
DB_PASSWORD=apppassword   # Database password
DB_DIALECT=mysql          # Database dialect (mysql, postgres, sqlite, mssql)
```

### Optional Variables (with defaults)
```env
# Connection Pool
DB_POOL_MAX=10            # Maximum connections
DB_POOL_MIN=0             # Minimum connections
DB_POOL_ACQUIRE=30000     # Max time (ms) to get connection
DB_POOL_IDLE=10000        # Max idle time (ms) before release

# Database Options
DB_LOGGING=false          # Enable SQL query logging
DB_TIMEZONE=+00:00        # Database timezone
DB_CHARSET=utf8mb4        # Character set
DB_COLLATE=utf8mb4_unicode_ci  # Collation
DB_CONNECT_TIMEOUT=10000  # Connection timeout (ms)
DB_BENCHMARK=false        # Benchmark queries
DB_RETRY_MAX=3            # Max connection retry attempts

# Model Options
DB_UNDERSCORED=false      # Use snake_case for columns
DB_FREEZE_TABLE_NAME=false # Don't pluralize table names
DB_PARANOID=false         # Enable soft deletes (deletedAt)

# SSL Configuration (Production)
DB_SSL=false              # Enable SSL
DB_SSL_REJECT_UNAUTHORIZED=true # Reject invalid certificates
```

## Usage

### 1. Import the Configuration

```typescript
// Import the entire module
import { sequelize, testConnection, syncDatabase, closeConnection } from '@/application/config/sequelize';

// Or import default
import sequelize from '@/application/config/sequelize';
```

### 2. Initialize in Server Startup

```typescript
import { testConnection, syncDatabase } from '@/application/config/sequelize';

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync models (be careful in production)
    if (process.env.NODE_ENV !== 'production') {
      await syncDatabase({ alter: true });
    }

    // Start your server
    app.listen(port);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};
```

### 3. Define Models

```typescript
import { DataTypes, Model } from 'sequelize';
import sequelize from '@/application/config/sequelize';

class User extends Model {
  public id!: number;
  public username!: string;
  public email!: string;
}

User.init({
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
  },
}, {
  sequelize,
  tableName: 'users',
  modelName: 'User',
});

export default User;
```

### 4. Perform Database Operations

```typescript
// Create
const user = await User.create({
  username: 'john_doe',
  email: 'john@example.com',
});

// Read
const users = await User.findAll();
const user = await User.findByPk(1);

// Update
await User.update(
  { email: 'new@example.com' },
  { where: { id: 1 } }
);

// Delete
await User.destroy({ where: { id: 1 } });
```

### 5. Use Transactions

```typescript
import sequelize from '@/application/config/sequelize';

const t = await sequelize.transaction();

try {
  await User.create({ username: 'john' }, { transaction: t });
  await User.create({ username: 'jane' }, { transaction: t });

  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}
```

### 6. Graceful Shutdown

```typescript
import { closeConnection } from '@/application/config/sequelize';

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});
```

## Best Practices

1. **Never use `force: true` in production** - It will drop all tables
2. **Use migrations** instead of `sync()` in production
3. **Enable SSL** for production databases
4. **Use connection pooling** for better performance
5. **Use transactions** for multi-step operations
6. **Close connections gracefully** on application shutdown
7. **Use environment variables** for all sensitive data
8. **Enable logging** only in development
9. **Use paranoid mode** for soft deletes if needed
10. **Validate data** at the model level

## Troubleshooting

### Connection Issues
- Verify database is running
- Check environment variables
- Ensure firewall allows connections
- Verify SSL settings for production

### Performance Issues
- Adjust pool settings
- Enable query benchmarking
- Check for N+1 query problems
- Use indexes on frequently queried fields

### Type Issues
- Install `@types/sequelize` (already included)
- Define proper model interfaces
- Use TypeScript strict mode

## Additional Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Sequelize TypeScript Guide](https://sequelize.org/docs/v6/other-topics/typescript/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

## Next Steps

1. Create your model files in `src/application/models/`
2. Set up migrations using `sequelize-cli` (optional but recommended)
3. Initialize database connection in your server startup
4. Delete the `example.usage.ts` file once you understand the usage

---

**Note**: This configuration supports MySQL by default, but can be easily adapted for PostgreSQL, SQLite, or MSSQL by changing the `DB_DIALECT` environment variable.
