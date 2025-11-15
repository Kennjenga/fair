# Fair - Next.js Project with PostgreSQL

A Next.js application with TypeScript, PostgreSQL database, migration system, API versioning, and Swagger documentation.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running locally or remotely

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env.local
```

3. Update `.env.local` with your PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fair_db
DB_USER=postgres
DB_PASSWORD=your_password_here
```

4. Create the database (if it doesn't exist):
```bash
psql -U postgres -c "CREATE DATABASE fair_db;"
```

5. Run database migrations:
```bash
npm run migrate
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Migrations

The project includes a migration system for managing database schema changes.

**Run migrations:**
```bash
npm run migrate
```

**Check migration status:**
```bash
npm run migrate:status
```

**Rollback last migration:**
```bash
npm run migrate:rollback
```

See [docs/MIGRATIONS.md](docs/MIGRATIONS.md) for detailed migration documentation.

### Database Usage

The project includes a database utility at `lib/db.ts` with the following functions:

- `query<T>(text, params)` - Execute a SQL query with type safety
- `getClient()` - Get a client from the pool for transactions
- `transaction<T>(callback)` - Execute operations within a transaction
- `closePool()` - Close all database connections

#### Example API Route

```typescript
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await query<{ id: number; name: string }>('SELECT * FROM users');
  return NextResponse.json(result.rows);
}
```

#### Example with Transactions

```typescript
import { transaction } from '@/lib/db';

await transaction(async (client) => {
  await client.query('INSERT INTO users (name, email) VALUES ($1, $2)', ['John', 'john@example.com']);
  const userId = await client.query('SELECT id FROM users WHERE email = $1', ['john@example.com']);
  await client.query('INSERT INTO profiles (user_id) VALUES ($1)', [userId.rows[0].id]);
});
```

#### Type Safety

The database utility supports TypeScript generics for type-safe queries:

```typescript
interface User {
  id: number;
  email: string;
  name: string;
  created_at: Date;
}

const result = await query<User>('SELECT * FROM users WHERE id = $1', [1]);
// result.rows is now typed as User[]
```

### API Documentation

**Swagger UI:** Visit [http://localhost:3000/docs](http://localhost:3000/docs) for interactive API documentation.

**OpenAPI JSON:** Available at [http://localhost:3000/api/docs](http://localhost:3000/api/docs) (JSON format)

### API Versioning

All API endpoints are versioned. The current version is `v1`:
- Health check: `GET /api/v1/health`
- Example endpoint: `GET /api/v1/example`

Future versions will be available at `/api/v2`, `/api/v3`, etc.

### Health Check

Test your database connection:
```bash
curl http://localhost:3000/api/v1/health
```

## Project Structure

```
fair/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── v1/           # Version 1 API endpoints
│   │   └── docs/         # Swagger documentation
│   └── ...
├── lib/                   # Utility functions
│   ├── db.ts             # Database connection and utilities
│   ├── migrations.ts     # Migration system
│   └── swagger.ts        # Swagger/OpenAPI configuration
├── migrations/           # Database migration files
├── scripts/              # Utility scripts
│   ├── migrate.ts       # Migration CLI
│   └── init-db.sql      # Initial database schema
├── docs/                 # Documentation
│   ├── API.md           # API documentation
│   ├── MIGRATIONS.md    # Migration guide
│   └── SETUP.md         # Setup guide
├── types/                # TypeScript type definitions
├── env.example           # Example environment variables
└── ...
```

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Database**: PostgreSQL with migration system
- **Styling**: Tailwind CSS
- **API Documentation**: Swagger/OpenAPI
- **API Versioning**: URL-based versioning (v1, v2, etc.)

## Documentation

- [API Documentation](docs/API.md) - API endpoint reference
- [Migrations Guide](docs/MIGRATIONS.md) - Database migration system
- [Setup Guide](docs/SETUP.md) - Complete setup instructions
