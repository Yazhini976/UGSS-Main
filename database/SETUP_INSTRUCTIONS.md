# Database Setup Instructions

Since `psql` is not in your PATH, please follow these manual steps:

## Option 1: Using pgAdmin (Recommended)

1. **Open pgAdmin** (the PostgreSQL GUI tool)

2. **Create Database**:
   - Right-click on "Databases" → "Create" → "Database"
   - Name: `civic_db`
   - Click "Save"

3. **Open Query Tool**:
   - Right-click on `civic_db` database → "Query Tool"

4. **Run Schema**:
   - Click "Open File" icon
   - Navigate to: `C:\UGSS\ugss-command-center-full\database\migrations\001_initial_schema.sql`
   - Click "Execute" (F5)

5. **Load Seed Data**:
   - Click "Open File" icon again
   - Navigate to: `C:\UGSS\ugss-command-center-full\database\seed\seed_data.sql`
   - Click "Execute" (F5)

## Option 2: Using SQL Shell (psql)

1. **Open SQL Shell (psql)** from Start Menu

2. **Connect** (press Enter for defaults, then enter your password):
   ```
   Server [localhost]:
   Database [postgres]:
   Port [5432]:
   Username [postgres]:
   Password: [your_password]
   ```

3. **Create Database**:
   ```sql
   CREATE DATABASE civic_db;
   \c civic_db
   ```

4. **Run Schema** (copy-paste the entire content of `001_initial_schema.sql`)

5. **Run Seed Data** (copy-paste the entire content of `seed_data.sql`)

## Verify Setup

Run this query to check if data loaded:
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM complaints;
SELECT COUNT(*) FROM stations;
```

You should see:
- users: 100
- complaints: 100
- stations: 20

## Update Backend .env

Make sure your `backend/.env` file has the correct password:
```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/civic_db?sslmode=disable
PORT=8080
```

Replace `YOUR_PASSWORD` with your actual PostgreSQL password.
