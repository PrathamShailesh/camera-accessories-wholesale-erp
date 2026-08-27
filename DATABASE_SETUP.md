# PostgreSQL Database Setup Guide

## Local PostgreSQL Setup (Docker - Recommended)

### Step 1: Install Docker Desktop
- Download and install Docker Desktop from https://www.docker.com/products/docker-desktop

### Step 2: Start PostgreSQL Container
Run this command in your terminal:

```bash
docker run --name camera-erp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgrespassword \
  -e POSTGRES_DB=camera_erp_dev \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Step 3: Verify Connection
```bash
docker exec -it camera-erp-postgres psql -U postgres -d camera_erp_dev
```

Type `\q` to exit.

## Alternative: Direct PostgreSQL Installation

### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install with default settings
3. During installation, set password to: `postgrespassword`
4. Create database named `camera_erp_dev`

### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
createdb camera_erp_dev
```

### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
CREATE DATABASE camera_erp_dev;
\q
```

## After Database is Running

### Step 1: Generate Prisma Client
```bash
npm run db:generate
```

### Step 2: Push Schema to Database
```bash
npm run db:push
```

### Step 3: Seed the Database
```bash
npm run db:seed
```

### Step 4: (Optional) Open Prisma Studio
```bash
npm run db:studio
```

## Cloud Migration (Later)

### Supabase
1. Create project at https://supabase.com
2. Get DATABASE_URL from project settings
3. Update .env with new DATABASE_URL
4. Run `npm run db:push`

### Neon
1. Create project at https://neon.tech
2. Get DATABASE_URL from dashboard
3. Update .env with new DATABASE_URL
4. Run `npm run db:push`

### AWS RDS
1. Create RDS PostgreSQL instance
2. Get connection string
3. Update .env with new DATABASE_URL
4. Run `npm run db:push`

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running: `docker ps` or check services
- Verify port 5432 is not in use
- Check DATABASE_URL in .env file

### Schema Already Exists
- Run: `npm run db:push --force-reset` (WARNING: deletes all data)
- Or manually drop the database and recreate

### Seed Fails
- Ensure schema is pushed first: `npm run db:push`
- Check if tables exist in database
- Check Prisma client is generated: `npm run db:generate`
