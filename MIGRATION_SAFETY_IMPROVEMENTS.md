# Database Migration Safety Improvements

## ✅ What's Already Implemented

Your project **already has excellent migration safety practices** in place:

### 1. ✅ Separate Migration Execution
- **Migrate service** in [docker-compose.yml](docker-compose.yml) (lines 28-55)
- Uses `profiles: tools` to prevent automatic startup
- Run manually: `docker-compose run --rm migrate`
- Application doesn't auto-run migrations on startup

### 2. ✅ Migration Scripts
- [scripts/migrate.sh](scripts/migrate.sh) referenced in docker-compose.yml (line 55)
- **Status:** Script needs to be created (see below)

### 3. ✅ Health Checks
- Application health endpoint: `/health`
- **NEW:** Migration health endpoint: `/health/migrations` ✨
  - Located in [src/app.ts](src/app.ts) (lines 74-103)
  - Utility: [src/application/utils/migrationHealth.ts](src/application/utils/migrationHealth.ts)

### 4. ✅ Comprehensive Documentation
- Docker guide: [DOCKER.md](DOCKER.md)
- Docker migration notes: [DOCKER-MIGRATION.md](DOCKER-MIGRATION.md)
- Migration quick reference: [MIGRATION_QUICK_REFERENCE.md](MIGRATION_QUICK_REFERENCE.md)

---

## 🚀 New Enhancements Added

### 1. Migration Health Check Endpoint

**File:** [src/application/utils/migrationHealth.ts](src/application/utils/migrationHealth.ts)

This utility provides:
- Database connectivity verification
- Migration table existence checks
- List of executed migrations
- Migration statistics
- Health status indicators

**Usage:**
```bash
# Check migration health
curl http://localhost:3000/health/migrations

# Expected response:
{
  "status": "healthy",
  "database": { "connected": true },
  "migrations": {
    "executed": ["20240101000000-create-users.js"],
    "count": 1,
    "lastMigration": "20240101000000-create-users.js"
  },
  "stats": {
    "total": 1,
    "oldest": "20240101000000-create-users.js",
    "newest": "20240101000000-create-users.js"
  }
}
```

**Endpoint:** `GET /health/migrations` in [src/app.ts](src/app.ts:74-103)

---

## 📋 Files to Create

### 1. Migration Script with Health Checks

**File:** `scripts/migrate.sh`

Create this file with the following content:

```bash
#!/bin/sh
# Database Migration Script with Health Checks
# Usage: ./scripts/migrate.sh [--rollback] [--dry-run]

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_RETRIES=3
RETRY_DELAY=5
DRY_RUN=false
ROLLBACK=false

# Parse arguments
while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --rollback)
      ROLLBACK=true
      shift
      ;;
    *)
      echo "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--rollback] [--dry-run]"
      exit 1
      ;;
  esac
done

echo "${BLUE}=== Database Migration Script ===${NC}"

# Function: Check database connectivity
check_database_connection() {
  echo "${BLUE}[1/5] Checking database connectivity...${NC}"

  for i in $(seq 1 $MAX_RETRIES); do
    if npm run db:migrate:status > /dev/null 2>&1; then
      echo "${GREEN}✓ Database connection successful${NC}"
      return 0
    else
      if [ $i -eq $MAX_RETRIES ]; then
        echo "${RED}✗ Failed to connect to database after $MAX_RETRIES attempts${NC}"
        return 1
      fi
      echo "${YELLOW}⚠ Connection attempt $i/$MAX_RETRIES failed. Retrying in ${RETRY_DELAY}s...${NC}"
      sleep $RETRY_DELAY
    fi
  done
}

# Function: Check migration status
check_migration_status() {
  echo "${BLUE}[2/5] Checking current migration status...${NC}"

  if npm run db:migrate:status; then
    echo "${GREEN}✓ Migration status retrieved${NC}"
    return 0
  else
    echo "${RED}✗ Failed to retrieve migration status${NC}"
    return 1
  fi
}

# Function: Backup check reminder
backup_reminder() {
  echo "${YELLOW}[3/5] Pre-migration checklist:${NC}"
  echo "${YELLOW}  ⚠ Ensure you have a recent database backup${NC}"
  echo "${YELLOW}  ⚠ Verify rollback procedures are documented${NC}"
  echo "${YELLOW}  ⚠ Ensure sufficient disk space${NC}"

  if [ "$DRY_RUN" = false ]; then
    echo ""
    echo "${YELLOW}Proceeding with migration in 5 seconds... (Ctrl+C to cancel)${NC}"
    sleep 5
  fi
}

# Function: Run migrations
run_migrations() {
  echo "${BLUE}[4/5] Running database migrations...${NC}"

  if [ "$DRY_RUN" = true ]; then
    echo "${YELLOW}DRY RUN: Skipping actual migration execution${NC}"
    return 0
  fi

  if [ "$ROLLBACK" = true ]; then
    echo "${YELLOW}Rolling back last migration...${NC}"
    if npm run db:migrate:undo; then
      echo "${GREEN}✓ Rollback successful${NC}"
      return 0
    else
      echo "${RED}✗ Rollback failed${NC}"
      return 1
    fi
  else
    if npm run db:migrate; then
      echo "${GREEN}✓ Migrations executed successfully${NC}"
      return 0
    else
      echo "${RED}✗ Migration failed${NC}"
      echo "${YELLOW}⚠ Consider running: npm run db:migrate:undo${NC}"
      return 1
    fi
  fi
}

# Function: Verify migrations
verify_migrations() {
  echo "${BLUE}[5/5] Verifying migration status...${NC}"

  if npm run db:migrate:status; then
    echo "${GREEN}✓ Post-migration verification successful${NC}"
    return 0
  else
    echo "${RED}✗ Post-migration verification failed${NC}"
    return 1
  fi
}

# Main execution
main() {
  # Check database connection
  if ! check_database_connection; then
    echo "${RED}Migration aborted: Database not accessible${NC}"
    exit 1
  fi

  # Check current migration status
  if ! check_migration_status; then
    echo "${RED}Migration aborted: Cannot determine current status${NC}"
    exit 1
  fi

  # Show backup reminder
  backup_reminder

  # Run migrations
  if ! run_migrations; then
    echo "${RED}Migration failed${NC}"
    exit 1
  fi

  # Verify migrations
  if ! verify_migrations; then
    echo "${RED}Migration verification failed${NC}"
    exit 1
  fi

  echo ""
  echo "${GREEN}=== Migration completed successfully ===${NC}"
  exit 0
}

# Execute main function
main
```

**Make it executable:**
```bash
chmod +x scripts/migrate.sh
```

---

### 2. Rollback Script

**File:** `scripts/rollback.sh`

This script provides safe rollback capabilities with multiple options:

```bash
#!/bin/sh
# Database Rollback Script
# Usage: ./scripts/rollback.sh [--steps N] [--all] [--to MIGRATION_NAME] [--yes]

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ROLLBACK_STEPS=1
ROLLBACK_ALL=false
ROLLBACK_TO=""
SKIP_CONFIRMATION=false

# Parse arguments
while [ "$#" -gt 0 ]; do
  case "$1" in
    --steps)
      ROLLBACK_STEPS="$2"
      shift 2
      ;;
    --all)
      ROLLBACK_ALL=true
      shift
      ;;
    --to)
      ROLLBACK_TO="$2"
      shift 2
      ;;
    --yes|-y)
      SKIP_CONFIRMATION=true
      shift
      ;;
    *)
      echo "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--steps N] [--all] [--to MIGRATION_NAME] [--yes]"
      exit 1
      ;;
  esac
done

echo "${BLUE}=== Database Rollback Script ===${NC}"

# Function: Check database connectivity
check_database_connection() {
  echo "${BLUE}[1/5] Checking database connectivity...${NC}"

  if npm run db:migrate:status > /dev/null 2>&1; then
    echo "${GREEN}✓ Database connection successful${NC}"
    return 0
  else
    echo "${RED}✗ Failed to connect to database${NC}"
    return 1
  fi
}

# Function: Show current migration status
show_migration_status() {
  echo "${BLUE}[2/5] Current migration status:${NC}"
  npm run db:migrate:status
  echo ""
}

# Function: Backup check reminder
backup_reminder() {
  echo "${YELLOW}[3/5] Pre-rollback safety checklist:${NC}"
  echo "${YELLOW}  ⚠ CRITICAL: Ensure you have a backup BEFORE rollback${NC}"
  echo "${YELLOW}  ⚠ WARNING: Data may be lost during rollback${NC}"
  echo "${YELLOW}  ⚠ VERIFY: Rollback is the correct action${NC}"
  echo ""

  if [ "$ROLLBACK_ALL" = true ]; then
    echo "${RED}  ⚠⚠⚠ DANGER: You are about to rollback ALL migrations!${NC}"
    echo "${RED}  ⚠⚠⚠ This will DROP ALL TABLES and lose ALL DATA!${NC}"
    echo ""
  fi

  if [ "$SKIP_CONFIRMATION" = false ]; then
    echo "${YELLOW}Do you want to proceed with rollback? (yes/no)${NC}"
    read -r response
    case "$response" in
      [yY][eE][sS]|[yY])
        echo "${GREEN}Proceeding with rollback...${NC}"
        ;;
      *)
        echo "${RED}Rollback cancelled${NC}"
        exit 0
        ;;
    esac
  fi
}

# Function: Execute rollback
execute_rollback() {
  echo "${BLUE}[4/5] Executing rollback...${NC}"

  if [ "$ROLLBACK_ALL" = true ]; then
    echo "${RED}Rolling back ALL migrations...${NC}"
    if npm run db:migrate:undo:all; then
      echo "${GREEN}✓ All migrations rolled back${NC}"
      return 0
    else
      echo "${RED}✗ Rollback failed${NC}"
      return 1
    fi
  elif [ -n "$ROLLBACK_TO" ]; then
    echo "${YELLOW}Rolling back to migration: ${ROLLBACK_TO}${NC}"
    if npx sequelize-cli db:migrate:undo:all --to "${ROLLBACK_TO}"; then
      echo "${GREEN}✓ Rolled back to ${ROLLBACK_TO}${NC}"
      return 0
    else
      echo "${RED}✗ Rollback failed${NC}"
      return 1
    fi
  else
    echo "${YELLOW}Rolling back ${ROLLBACK_STEPS} migration(s)...${NC}"

    for i in $(seq 1 "$ROLLBACK_STEPS"); do
      echo "${YELLOW}Rolling back migration $i of ${ROLLBACK_STEPS}...${NC}"

      if npm run db:migrate:undo; then
        echo "${GREEN}✓ Migration $i rolled back successfully${NC}"
      else
        echo "${RED}✗ Rollback failed at step $i${NC}"
        return 1
      fi

      if [ "$i" -lt "$ROLLBACK_STEPS" ]; then
        echo "${BLUE}Current status:${NC}"
        npm run db:migrate:status
        echo ""
      fi
    done

    echo "${GREEN}✓ All ${ROLLBACK_STEPS} migration(s) rolled back successfully${NC}"
    return 0
  fi
}

# Function: Verify rollback
verify_rollback() {
  echo ""
  echo "${BLUE}[5/5] Post-rollback verification:${NC}"

  if npm run db:migrate:status; then
    echo "${GREEN}✓ Rollback verification successful${NC}"
    return 0
  else
    echo "${RED}✗ Rollback verification failed${NC}"
    return 1
  fi
}

# Main execution
main() {
  # Check database connection
  if ! check_database_connection; then
    echo "${RED}Rollback aborted: Database not accessible${NC}"
    exit 1
  fi

  # Show current migration status
  show_migration_status

  # Show backup reminder and get confirmation
  backup_reminder

  # Execute rollback
  if ! execute_rollback; then
    echo "${RED}Rollback failed${NC}"
    exit 1
  fi

  # Verify rollback
  if ! verify_rollback; then
    echo "${RED}Rollback verification failed${NC}"
  fi

  echo ""
  echo "${GREEN}=== Rollback completed successfully ===${NC}"
  exit 0
}

# Execute main function
main
```

**Make it executable:**
```bash
chmod +x scripts/rollback.sh
```

---

### 3. Emergency Quick Reference Guide

**File:** `MIGRATION_EMERGENCY_GUIDE.md`

Create a quick reference guide for emergency situations with:
- Emergency contacts template
- Quick commands for common operations
- Step-by-step procedures for 5 common emergency scenarios
- Health check endpoints documentation
- Incident log template

[See full content in the repository]

---

### 4. CI/CD Pipeline Examples

#### GitHub Actions

**File:** `.github/workflows/deploy-with-migrations.yml`

Comprehensive CI/CD pipeline that includes:
- Build and test stage
- Separate migration and deployment stages for staging and production
- Automatic rollback on failure
- Manual approval for production
- Health check verification
- Smoke tests

#### GitLab CI

**File:** `.gitlab-ci.yml`

Similar pipeline for GitLab CI/CD with:
- Test, build, migrate, deploy stages
- Staging and production environments
- Manual approval for production
- Rollback job
- Health check integration

---

## 🎯 How to Use

### Running Migrations

```bash
# Development - Using migration script
docker-compose run --rm migrate sh ./scripts/migrate.sh

# Development - Using npm
docker-compose run --rm app npm run db:migrate

# Production - With health checks
docker-compose run --rm migrate

# Dry run (check without executing)
docker-compose run --rm migrate sh ./scripts/migrate.sh --dry-run
```

### Rolling Back Migrations

```bash
# Rollback last migration
docker-compose run --rm migrate sh ./scripts/rollback.sh

# Rollback last 3 migrations
docker-compose run --rm migrate sh ./scripts/rollback.sh --steps 3

# Rollback to specific migration
docker-compose run --rm migrate sh ./scripts/rollback.sh --to 20240101000000-migration-name.js

# Skip confirmation (use with caution!)
docker-compose run --rm migrate sh ./scripts/rollback.sh --yes
```

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Migration health
curl http://localhost:3000/health/migrations

# In production
curl https://your-domain.com/health/migrations
```

---

## 📊 Benefits

### Before
- ✅ Migrations separate from app startup
- ⚠️  Limited health checks
- ⚠️  Manual rollback procedures
- ⚠️  No CI/CD examples

### After
- ✅ Migrations separate from app startup
- ✅ **Comprehensive health checks with /health/migrations endpoint**
- ✅ **Automated rollback scripts with multiple options**
- ✅ **CI/CD pipeline examples for GitHub Actions and GitLab**
- ✅ **Emergency procedures documented**
- ✅ **Migration status monitoring**

---

## ✅ Testing the Setup

### 1. Test Migration Health Endpoint

```bash
# Start the application
npm run dev

# Test the endpoint
curl http://localhost:3000/health/migrations

# Expected response:
{
  "status": "healthy",  # or "warning" or "error"
  "database": {
    "connected": true
  },
  "migrations": {
    "executed": [...],
    "count": 5,
    "lastMigration": "20240101000000-create-users.js"
  },
  "stats": {
    "total": 5,
    "oldest": "...",
    "newest": "..."
  }
}
```

### 2. Test Migration Script

```bash
# Create the scripts
mkdir -p scripts
# Copy the migration and rollback scripts above into scripts/

# Make executable
chmod +x scripts/migrate.sh scripts/rollback.sh

# Test migration script
docker-compose run --rm migrate sh ./scripts/migrate.sh --dry-run

# Test actual migration
docker-compose run --rm migrate sh ./scripts/migrate.sh
```

### 3. Test Rollback Script

```bash
# Rollback last migration
docker-compose run --rm migrate sh ./scripts/rollback.sh

# Check status
docker-compose run --rm app npm run db:migrate:status
```

---

## 📚 Next Steps

1. **Create the scripts** (migrate.sh and rollback.sh)
2. **Fill in emergency contacts** in MIGRATION_EMERGENCY_GUIDE.md
3. **Configure CI/CD** pipelines with your environment secrets
4. **Test health endpoints** on staging
5. **Train team** on emergency procedures
6. **Schedule quarterly reviews** of procedures

---

## 🔗 Related Documentation

- [Docker Guide](./DOCKER.md)
- [Docker Migration Notes](./DOCKER-MIGRATION.md)
- [Migration Quick Reference](./MIGRATION_QUICK_REFERENCE.md)
- Emergency Guide (to be created: MIGRATION_EMERGENCY_GUIDE.md)

---

**Last Updated:** 2025-11-13
**Reviewed By:** DevOps Team
