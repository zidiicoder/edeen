# E-Deen Backend - Database Setup Guide

## Database Schema Overview

The E-Deen app uses MySQL database with the following main tables:

### Core Tables:
1. **users** - User accounts and authentication
2. **otps** - OTP codes for email verification and password reset
3. **password_resets** - Password reset tokens
4. **user_settings** - User preferences and app settings
5. **habits** - User habit tracking (7, 14, 21, 40, 66, 90 days)
6. **habit_completions** - Daily habit completion records
7. **journal_entries** - User journal/diary entries
8. **reminders** - User reminders and tasks

## Setup Instructions

### Step 1: Create MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE edeen_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit MySQL
EXIT;
```

### Step 2: Configure Environment

Update the `.env` file with your MySQL credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=edeen_app
DB_USERNAME=root
DB_PASSWORD=your_password_here
```

### Step 3: Import Database Schema

Import the complete schema from the SQL file:

```bash
# Option 1: Using mysql command line
mysql -u root -p edeen_app < database/schema.sql

# Option 2: Using MySQL Workbench or phpMyAdmin
# Import the file: database/schema.sql
```

### Step 4: Verify Tables

```bash
# Login to MySQL
mysql -u root -p edeen_app

# Show all tables
SHOW TABLES;

# You should see 8 tables:
# - users
# - otps
# - password_resets
# - user_settings
# - habits
# - habit_completions
# - journal_entries
# - reminders
```

## Authentication Flow

### 1. Registration Flow
```
User fills form → POST /api/register → OTP sent to email → User enters OTP → POST /api/verify-otp → Account verified → User can login
```

### 2. Login Flow
```
User enters email/password → POST /api/login → JWT token returned → User authenticated
```

### 3. Forgot Password Flow
```
User enters email → POST /api/forgot-password → OTP sent → User enters OTP → POST /api/reset-password → Password updated
```

## Database Design Highlights

### Foreign Keys
- All tables properly linked with foreign keys
- Cascading deletes enabled (when user deleted, all related data deleted)
- Cascading updates enabled

### Indexes
- Email indexes for fast lookup
- Date indexes for journal entries and habits
- User ID indexes for quick user data retrieval
- Composite indexes for frequently queried combinations

### Data Types
- VARCHAR for text fields
- TEXT/LONGTEXT for large content
- ENUM for fixed options (frequency, reminder_type, etc.)
- TINYINT(1) for boolean values
- TIMESTAMP for date tracking
- JSON for flexible data (repeat_days in reminders)

## Sample Test User

A test user is included in the schema for development:

```
Email: test@example.com
Password: password123
```

## OTP Configuration

- OTP length: 6 digits
- OTP types: registration, password_reset
- OTP expiration: Configurable in backend code
- OTP is single-use (is_used flag)

## Habit Frequencies Supported

- daily
- 7_days (1 week)
- 14_days (2 weeks)  
- 21_days (3 weeks)
- 40_days
- 66_days
- 90_days (3 months)

## API Endpoints (To be implemented)

### Authentication
- `POST /api/register` - Register new user
- `POST /api/verify-otp` - Verify email OTP
- `POST /api/resend-otp` - Resend OTP
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Reset password with OTP

### User
- `GET /api/user` - Get authenticated user
- `PUT /api/user` - Update user profile
- `GET /api/user/settings` - Get user settings
- `PUT /api/user/settings` - Update user settings

### Habits
- `GET /api/habits` - Get all user habits
- `POST /api/habits` - Create new habit
- `GET /api/habits/{id}` - Get single habit
- `PUT /api/habits/{id}` - Update habit
- `DELETE /api/habits/{id}` - Delete habit
- `POST /api/habits/{id}/complete` - Mark habit as complete for a date
- `DELETE /api/habits/{id}/complete` - Unmark habit completion

### Journal
- `GET /api/journals` - Get all journal entries
- `POST /api/journals` - Create journal entry
- `GET /api/journals/{id}` - Get single entry
- `PUT /api/journals/{id}` - Update entry
- `DELETE /api/journals/{id}` - Delete entry

### Reminders
- `GET /api/reminders` - Get all reminders
- `POST /api/reminders` - Create reminder
- `GET /api/reminders/{id}` - Get single reminder
- `PUT /api/reminders/{id}` - Update reminder
- `DELETE /api/reminders/{id}` - Delete reminder
- `PUT /api/reminders/{id}/complete` - Mark reminder as complete

## Next Steps

1. ✅ Database schema created
2. ⏳ Create Laravel migrations (optional, we're using raw SQL)
3. ⏳ Create API controllers for authentication
4. ⏳ Implement JWT authentication
5. ⏳ Create API controllers for habits, journal, reminders
6. ⏳ Set up email service for OTP
7. ⏳ Test all API endpoints

## Troubleshooting

### MySQL Connection Failed
```bash
# Check MySQL service is running
# Windows: services.msc → MySQL
# Linux: sudo service mysql status

# Verify credentials in .env file
# Try connecting manually:
mysql -u root -p
```

### Foreign Key Errors
```bash
# Make sure tables are created in correct order
# Drop all tables and reimport schema.sql
```

### Character Encoding Issues
```bash
# Ensure database and tables use utf8mb4
# Check with:
SHOW CREATE DATABASE edeen_app;
SHOW CREATE TABLE users;
```

## Support

For issues or questions, refer to the Laravel documentation:
- https://laravel.com/docs/11.x/database
- https://laravel.com/docs/11.x/eloquent
