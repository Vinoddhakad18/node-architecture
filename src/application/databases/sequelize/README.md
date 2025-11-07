# Sequelize Migrations and Seeders

This directory contains database migrations and seeders for the application.

## Directory Structure

```
src/application/databases/sequelize/
├── config.js           # Sequelize CLI configuration file
├── migrations/         # Database migrations
├── seeders/           # Database seeders
└── README.md          # This file
```

## Configuration

The Sequelize CLI is configured via `.sequelizerc` file at the project root, which points to:
- Config: `src/application/databases/sequelize/config.js`
- Migrations: `src/application/databases/sequelize/migrations/`
- Seeders: `src/application/databases/sequelize/seeders/`
- Models: `src/application/models/`

## Available Commands

### Migrations

```bash
# Run all pending migrations
npm run db:migrate

# Undo the last migration
npm run db:migrate:undo

# Undo all migrations
npm run db:migrate:undo:all

# Check migration status
npm run db:migrate:status

# Create a new migration
npm run migration:create -- <migration-name>
```

### Seeders

```bash
# Run all seeders
npm run db:seed

# Undo the last seeder
npm run db:seed:undo

# Undo all seeders
npm run db:seed:undo:all

# Create a new seeder
npm run seed:create -- <seeder-name>
```

## Examples

### Create a new migration

```bash
npm run migration:create -- create-users-table
```

This will create a new migration file in `src/application/databases/sequelize/migrations/`

### Create a new seeder

```bash
npm run seed:create -- demo-users
```

This will create a new seeder file in `src/application/databases/sequelize/seeders/`

### Run migrations

```bash
npm run db:migrate
```

### Run seeders

```bash
npm run db:seed
```

## Migration File Example

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
```

## Seeder File Example

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
```

## Environment Variables

The configuration uses the following environment variables:
- `NODE_ENV` - Environment (development, test, production)
- `DB_HOST` - Database host
- `DB_PORT` - Database port (default: 3306)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_CHARSET` - Character set (default: utf8mb4)
- `DB_POOL_MAX` - Maximum pool connections (default: 10)
- `DB_POOL_MIN` - Minimum pool connections (default: 0)
- `DB_POOL_ACQUIRE` - Pool acquire timeout (default: 30000)
- `DB_POOL_IDLE` - Pool idle timeout (default: 10000)

## Best Practices

1. Always create migrations for database schema changes
2. Never modify existing migrations that have been run in production
3. Use descriptive names for migrations and seeders
4. Test migrations both up and down before deploying
5. Use seeders only for development/test data, not production data
6. Keep migrations atomic and focused on a single change
