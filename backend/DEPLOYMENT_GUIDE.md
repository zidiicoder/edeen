# Edeen Backend Deployment Guide

## Current Status
- **Domain**: https://edeenapp.co.uk/
- **Hosting**: Hostinger (Shared Hosting)
- **Laravel Version**: 11.x
- **PHP Required**: 8.2+
- **Database**: MySQL

## Server Details
- **IP**: 77.37.37.189
- **SSH Port**: 65002
- **Username**: u963776255
- **Database Name**: u963776255_e_deen_app
- **Database User**: u963776255_app_edeen

---

## 🔴 CRITICAL ISSUES TO FIX

### 1. **APP_KEY is Missing**
The Laravel application key is **EMPTY** which will cause encryption errors.

**Fix via SSH:**
```bash
cd /home/u963776255/domains/edeenapp.co.uk/Laravel
php artisan key:generate
```

### 2. **Laravel Folder Location**
The Laravel project is in `/Laravel` folder but needs to be accessible via web.

**Current Structure (WRONG):**
```
/home/u963776255/domains/edeenapp.co.uk/
├── public_html/          ← Web root (currently empty or has default files)
└── Laravel/              ← Your Laravel project
    ├── app/
    ├── public/
    ├── .env
    └── ...
```

**Two Options to Fix:**

#### **Option A: Symlink (Recommended)**
Create symbolic link from `public_html` to `Laravel/public`:

```bash
# SSH Commands
cd /home/u963776255/domains/edeenapp.co.uk
rm -rf public_html/*
ln -s /home/u963776255/domains/edeenapp.co.uk/Laravel/public/* /home/u963776255/domains/edeenapp.co.uk/public_html/
```

#### **Option B: Move Everything**
Move Laravel files so `public` folder is the web root:

```bash
# SSH Commands
cd /home/u963776255/domains/edeenapp.co.uk
mv Laravel/* ./
mv Laravel/.* ./
rmdir Laravel
# Then set public_html to point to 'public' folder via hosting control panel
```

### 3. **Storage Permissions**
Laravel needs write permissions for storage and cache:

```bash
cd /home/u963776255/domains/edeenapp.co.uk/Laravel
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

### 4. **Composer Dependencies**
Make sure all PHP dependencies are installed:

```bash
cd /home/u963776255/domains/edeenapp.co.uk/Laravel
composer install --no-dev --optimize-autoloader
```

### 5. **Database Migrations**
Run database migrations to create all tables:

```bash
cd /home/u963776255/domains/edeenapp.co.uk/Laravel
php artisan migrate --force
```

### 6. **Optimize for Production**
Cache configuration and routes:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 📋 COMPLETE SSH DEPLOYMENT SCRIPT

Run these commands in order via SSH:

```bash
# 1. Navigate to Laravel directory
cd /home/u963776255/domains/edeenapp.co.uk/Laravel

# 2. Generate Application Key
php artisan key:generate --force

# 3. Set proper permissions
chmod -R 775 storage
chmod -R 775 bootstrap/cache
find storage -type f -exec chmod 664 {} \;
find bootstrap/cache -type f -exec chmod 664 {} \;

# 4. Install composer dependencies (if not already done)
composer install --no-dev --optimize-autoloader

# 5. Clear old caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# 6. Run migrations
php artisan migrate --force

# 7. Cache everything for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 8. Fix web root access (choose ONE option below)

# Option A: Create symlinks in public_html
cd /home/u963776255/domains/edeenapp.co.uk/public_html
ln -sf ../Laravel/public/index.php index.php
ln -sf ../Laravel/public/.htaccess .htaccess

# Option B: Use .htaccess redirect
# Create this file: /home/u963776255/domains/edeenapp.co.uk/public_html/.htaccess
# With content:
# RewriteEngine On
# RewriteRule ^(.*)$ /Laravel/public/$1 [L]
```

---

## 🌐 UPDATE MOBILE APP API URL

After backend is deployed, update the mobile app:

### File: `e:\edeen\src\utils\api.js`

Change line 6:
```javascript
// OLD (not working)
baseURL: "https://edeen.innovationpixel.com/public/api/",

// NEW (your domain)
baseURL: "https://edeenapp.co.uk/api/",
```

---

## ✅ VERIFICATION CHECKLIST

After deployment, test these URLs:

### 1. **Test Laravel Installation**
Visit: https://edeenapp.co.uk/

**Expected**: Laravel welcome page OR JSON response (not 404/500 error)

### 2. **Test API Endpoint**
```bash
curl https://edeenapp.co.uk/api/login
```

**Expected Response:**
```json
{
  "message": "The email field is required. (and 1 more error)",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password field is required."]
  }
}
```

### 3. **Test Login with Real Credentials**
```bash
curl -X POST https://edeenapp.co.uk/api/login \
  -F "email=forcann66@gmail.com" \
  -F "password=Abcd@123"
```

**Expected**: JSON with access_token OR error message

---

## 🔥 COMMON ISSUES & FIXES

### Issue 1: "500 Internal Server Error"
**Cause**: APP_KEY missing or file permissions wrong

**Fix**:
```bash
php artisan key:generate --force
chmod -R 775 storage
```

### Issue 2: "404 Not Found" for API routes
**Cause**: .htaccess not working or web root pointing to wrong folder

**Fix**: Check .htaccess exists in web root with mod_rewrite rules

### Issue 3: Database connection failed
**Cause**: Wrong credentials in .env

**Fix**: Verify database credentials in cPanel and update .env

### Issue 4: CORS errors in mobile app
**Cause**: Laravel not configured to allow mobile app requests

**Fix**: Already configured in `config/cors.php` (should work)

---

## 📱 REBUILD MOBILE APP APK

After updating API URL in `api.js`:

```bash
# Windows PowerShell
cd e:\edeen
git add src/utils/api.js
git commit -m "Update API URL to edeenapp.co.uk"
git push origin rn-0.83-newarch
git push origin main

# Build APK
cd android
.\gradlew clean
.\gradlew assembleRelease

# APK Location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔐 SECURITY NOTES

1. **Never commit `.env` file to Git** ✅ (already in .gitignore)
2. **Keep APP_KEY secret** - It encrypts all sensitive data
3. **Use HTTPS** ✅ (you have https://edeenapp.co.uk)
4. **Disable APP_DEBUG in production** ✅ (already false)

---

## 📞 SUPPORT

If issues persist after following this guide:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Check hosting error logs in cPanel
3. Test each endpoint individually with curl/Postman

---

**Created**: June 15, 2026
**Domain**: https://edeenapp.co.uk/
**Backend**: Laravel 11.x
