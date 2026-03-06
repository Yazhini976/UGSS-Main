@echo off
echo Setting up UGSS Command Center Database...
echo.

REM Set your PostgreSQL credentials here
set PGUSER=postgres
set PGPASSWORD=your_password_here

echo Step 1: Creating database (if it doesn't exist)...
psql -U %PGUSER% -c "CREATE DATABASE civic_db;" 2>nul
if %errorlevel% equ 0 (
    echo Database created successfully!
) else (
    echo Database already exists or error occurred, continuing...
)

echo.
echo Step 2: Creating tables...
psql -U %PGUSER% -d civic_db -f "migrations/001_initial_schema.sql"

echo.
echo Step 3: Loading seed data (100 sample records)...
psql -U %PGUSER% -d civic_db -f "seed/seed_data.sql"

echo.
echo Setup complete! Database is ready.
echo.
pause
