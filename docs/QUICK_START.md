# Quick Start Guide

Get up and running with the Fair project in minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

```bash
cp env.example .env.local
```

Edit `.env.local` with your database credentials.

## 3. Create Database

```bash
psql -U postgres -c "CREATE DATABASE fair_db;"
```

## 4. Run Migrations

```bash
npm run migrate
```

## 5. Start Development Server

```bash
npm run dev
```

## 6. Verify Setup

- **Homepage**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/v1/health
- **Swagger Documentation**: http://localhost:3000/api/docs

## Common Commands

```bash
# Development
npm run dev

# Run migrations
npm run migrate

# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:rollback

# Build for production
npm run build

# Start production server
npm start
```

## Project Features

✅ Next.js 16 with TypeScript  
✅ PostgreSQL database with connection pooling  
✅ Database migration system  
✅ API versioning (v1)  
✅ Swagger/OpenAPI documentation  
✅ Type-safe database queries  
✅ Transaction support  

## Next Steps

- Read [SETUP.md](SETUP.md) for detailed setup instructions
- Check [API.md](API.md) for API endpoint documentation
- Review [MIGRATIONS.md](MIGRATIONS.md) for migration system details


