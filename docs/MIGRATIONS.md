# Database Migrations

This project uses a custom migration system to manage database schema changes.

## Migration Files

Migrations are stored in the `migrations/` directory. Each migration file should:
- Be named with a number prefix and descriptive name (e.g., `001_initial_schema.sql`)
- Contain both UP and DOWN migrations separated by `-- DOWN` comment
- Use SQL syntax compatible with PostgreSQL

## Migration File Format

```sql
-- UP
-- Description of what this migration does
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- DOWN
-- How to reverse this migration
DROP TABLE IF EXISTS users;
```

## Running Migrations

### Run all pending migrations
```bash
npm run migrate
```

### Check migration status
```bash
npm run migrate:status
```

### Rollback last migration
```bash
npm run migrate:rollback
```

## Migration Best Practices

1. **Always include DOWN migrations** - Every migration should be reversible
2. **Use transactions** - The migration system automatically wraps migrations in transactions
3. **Test migrations** - Test both UP and DOWN migrations before deploying
4. **Never modify executed migrations** - Create a new migration instead
5. **Use descriptive names** - Migration names should clearly describe what they do

## Migration Tracking

The system automatically tracks executed migrations in the `migrations` table:
- `id` - Auto-incrementing ID
- `name` - Migration file name (without .sql extension)
- `executed_at` - Timestamp when migration was executed

## Creating New Migrations

1. Create a new SQL file in the `migrations/` directory
2. Name it with the next sequential number (e.g., `003_add_indexes.sql`)
3. Include both UP and DOWN sections
4. Run `npm run migrate` to execute it

