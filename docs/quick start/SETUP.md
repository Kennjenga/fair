# Setup Guide

Complete guide to setting up the Fair project.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:
```bash
cp env.example .env.local
```

Edit `.env.local` with your actual database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fair_db
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### 3. Create Database

```bash
psql -U postgres -c "CREATE DATABASE fair_db;"
```

### 4. Run Migrations

```bash
npm run migrate
```

This will create all necessary database tables and set up the schema.

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Verification

### Check Database Connection

Visit `http://localhost:3000/api/v1/health` to verify the database connection is working.

### Check API Documentation

Visit `http://localhost:3000/api/docs` to view the Swagger API documentation.

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env.local`
- Ensure the database exists: `psql -U postgres -l`

### Migration Issues

- Check migration status: `npm run migrate:status`
- Review migration files in `migrations/` directory
- Check database logs for detailed error messages


