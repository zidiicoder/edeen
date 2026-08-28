# E-Deen Backend - Quick Setup Guide

## Step-by-Step Setup (5 Minutes)

### Step 1: Create Database (1 minute)

Open your MySQL client (phpMyAdmin, MySQL Workbench, or command line) and run:

```sql
CREATE DATABASE edeen_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Import Schema (1 minute)

**Option A: Using Command Line**
```bash
cd E:\edeen\backend
mysql -u root -p edeen_app < database/schema.sql
```

**Option B: Using phpMyAdmin**
1. Select `edeen_app` database
2. Click "Import" tab
3. Choose file: `E:\edeen\backend\database\schema.sql`
4. Click "Go"

**Option C: Using MySQL Workbench**
1. Open `edeen_app` database
2. File → Run SQL Script
3. Select `E:\edeen\backend\database\schema.sql`
4. Click "Run"

### Step 3: Verify Tables (30 seconds)

```sql
USE edeen_app;
SHOW TABLES;
```

You should see 8 tables:
- users
- otps
- password_resets
- user_settings
- habits
- habit_completions
- journal_entries
- reminders

### Step 4: Check Sample Data (30 seconds)

```sql
SELECT * FROM users;
```

You should see 1 test user:
- Email: test@example.com
- Password: password123

### Step 5: Update .env File (1 minute)

The `.env` file is already configured. Just update the password:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=edeen_app
DB_USERNAME=root
DB_PASSWORD=your_mysql_password_here
```

### Step 6: Test Connection (30 seconds)

```bash
cd E:\edeen\backend
php artisan migrate:status
```

If connection is successful, you're ready!

## Verification Checklist

- [ ] Database `edeen_app` created
- [ ] 8 tables imported successfully
- [ ] Sample user exists in `users` table
- [ ] Foreign keys properly set up
- [ ] `.env` file updated with correct password
- [ ] Laravel can connect to database

## Common Issues

### Issue 1: "Access denied for user"
**Solution:** Check your MySQL username and password in `.env` file

### Issue 2: "Database does not exist"
**Solution:** Run Step 1 again to create the database

### Issue 3: "Foreign key constraint fails"
**Solution:** Drop all tables and reimport the schema.sql file

## What's Next?

After successful setup:
1. Implement Authentication API (register, login, OTP)
2. Set up email service for OTP
3. Create API endpoints for habits, journal, reminders
4. Test with Postman
5. Connect frontend to backend

## Quick Test Queries

```sql
-- Check all tables exist
SHOW TABLES;

-- Check users table structure
DESCRIBE users;

-- Check foreign keys
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'edeen_app';

-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'otps', COUNT(*) FROM otps
UNION ALL
SELECT 'habits', COUNT(*) FROM habits
UNION ALL
SELECT 'journal_entries', COUNT(*) FROM journal_entries
UNION ALL
SELECT 'reminders', COUNT(*) FROM reminders;
```

## Database Connection String

For external tools:
```
Host: 127.0.0.1
Port: 3306
Database: edeen_app
Username: root
Password: [your password]
```

---

**Setup Complete!** ✅

Your backend database is now ready for API development.

Next step: Implement authentication controllers and routes.
