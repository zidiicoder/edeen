# 🚀 Complete Setup Instructions for Edeen App

## ✅ GOOD NEWS!

Your mobile app API URL is **already configured** correctly:
- Mobile app points to: `https://edeenapp.co.uk/api/` ✅
- Backend uploaded to hosting ✅
- Database credentials configured ✅

---

## 🔴 WHAT NEEDS TO BE DONE

The backend needs to be properly deployed on your Hostinger server. Here's what to do:

---

## METHOD 1: Use SSH (Automated - Recommended)

### Step 1: Connect via SSH

**Option A: Using PuTTY (Windows)**
1. Download PuTTY: https://www.putty.org/
2. Open PuTTY
3. Enter these settings:
   - **Host Name**: 77.37.37.189
   - **Port**: 65002
   - Click "Open"
4. Login with:
   - **Username**: u963776255
   - **Password**: v_#8TqmW#PA3V*T

**Option B: Using Windows PowerShell/CMD**
```bash
ssh u963776255@77.37.37.189 -p 65002
# Enter password when prompted: v_#8TqmW#PA3V*T
```

### Step 2: Upload and Run Deployment Script

After connecting via SSH, run these commands:

```bash
# Navigate to Laravel directory
cd /home/u963776255/domains/edeenapp.co.uk/Laravel

# Create deployment script
cat > deploy.sh << 'EOFSCRIPT'
#!/bin/bash
echo "🚀 Starting Edeen Backend Deployment..."

# Generate APP_KEY
php artisan key:generate --force

# Set permissions
chmod -R 775 storage
chmod -R 775 bootstrap/cache

# Clear caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Run migrations
php artisan migrate --force

# Optimize
php artisan config:cache
php artisan route:cache

echo "✅ Deployment Complete!"
echo "Test: curl https://edeenapp.co.uk/api/login"
EOFSCRIPT

# Make it executable and run
chmod +x deploy.sh
./deploy.sh
```

### Step 3: Fix Web Root Access

The Laravel folder needs to be accessible via the web. Run ONE of these options:

**Option A: Create .htaccess redirect (Easiest)**
```bash
cd /home/u963776255/domains/edeenapp.co.uk/public_html

cat > .htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ /Laravel/public/$1 [L]
</IfModule>
EOF
```

**Option B: Move Laravel to correct location**
```bash
cd /home/u963776255/domains/edeenapp.co.uk
mv Laravel/* ./
mv Laravel/.* ./
rmdir Laravel
```

---

## METHOD 2: Use cPanel File Manager (Manual)

If you can't use SSH, use cPanel:

### Step 1: Generate APP_KEY

1. Go to cPanel → **Terminal** (or **SSH Access**)
2. Run:
```bash
cd /home/u963776255/domains/edeenapp.co.uk/Laravel
php artisan key:generate --force
```

### Step 2: Fix Permissions

In cPanel → **File Manager**:
1. Navigate to: `/home/u963776255/domains/edeenapp.co.uk/Laravel`
2. Right-click on `storage` folder → **Change Permissions**
3. Set to: **775** (or check all boxes for Owner and Group)
4. Check "Recurse into subdirectories"
5. Repeat for `bootstrap/cache` folder

### Step 3: Run Database Migrations

In cPanel Terminal:
```bash
cd /home/u963776255/domains/edeenapp.co.uk/Laravel
php artisan migrate --force
```

### Step 4: Create .htaccess in public_html

1. Go to: `/home/u963776255/domains/edeenapp.co.uk/public_html`
2. Create new file: `.htaccess`
3. Add this content:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ /Laravel/public/$1 [L]
</IfModule>
```

### Step 5: Cache Configuration

In cPanel Terminal:
```bash
cd /home/u963776255/domains/edeenapp.co.uk/Laravel
php artisan config:cache
php artisan route:cache
```

---

## 🧪 TEST THE BACKEND

After deployment, test these:

### Test 1: Check if Laravel is running
Open browser: https://edeenapp.co.uk/

**Expected**: Should NOT show "404" or "This site can't be reached"

### Test 2: Check API endpoint
Open browser: https://edeenapp.co.uk/api/login

**Expected**: JSON error about missing email/password (this is good!)
```json
{
  "message": "The email field is required...",
  "errors": {...}
}
```

### Test 3: Test login (using Postman or curl)

**Using PowerShell:**
```powershell
curl.exe -X POST https://edeenapp.co.uk/api/login `
  -F "email=forcann66@gmail.com" `
  -F "password=Abcd@123"
```

**Expected**: JSON with `access_token` OR clear error message

---

## 📱 REBUILD AND TEST MOBILE APP

The mobile app API URL is already correct, so just rebuild:

### Step 1: Build New APK

```powershell
# In PowerShell
cd e:\edeen\android
.\gradlew clean
.\gradlew assembleRelease
```

### Step 2: Install on Device

```powershell
adb install app\build\outputs\apk\release\app-release.apk
```

### Step 3: Test Login

1. Open app
2. Enter credentials:
   - Email: forcann66@gmail.com
   - Password: Abcd@123
3. Tap "Sign In"

**Expected**: Should login successfully! 🎉

---

## ❌ TROUBLESHOOTING

### Problem 1: "500 Internal Server Error"

**Cause**: Missing APP_KEY or wrong permissions

**Fix**:
```bash
cd /home/u963776255/domains/edeenapp.co.uk/Laravel
php artisan key:generate --force
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

### Problem 2: "404 Not Found" on API routes

**Cause**: Web root not pointing to Laravel

**Fix**: Make sure `.htaccess` redirect is created in `public_html`

### Problem 3: Database connection error

**Cause**: Wrong database credentials

**Fix**: Edit `.env` file and verify:
```
DB_DATABASE=u963776255_e_deen_app
DB_USERNAME=u963776255_app_edeen
DB_PASSWORD=tMee5Xis$xG.B27
```

### Problem 4: "Network Error" in mobile app

**Cause**: Backend not accessible OR HTTPS issue

**Fix**:
1. Test backend URL in browser first
2. Make sure using HTTPS (not HTTP)
3. Check Laravel logs: `storage/logs/laravel.log`

### Problem 5: CORS errors

**Cause**: Backend rejecting requests from mobile app

**Fix**: Already configured in Laravel, but if needed:
```bash
php artisan config:clear
php artisan config:cache
```

---

## 📋 QUICK COMMAND REFERENCE

**SSH Login:**
```bash
ssh u963776255@77.37.37.189 -p 65002
```

**Navigate to Laravel:**
```bash
cd /home/u963776255/domains/edeenapp.co.uk/Laravel
```

**Check .env file:**
```bash
cat .env | grep APP_KEY
```

**View Laravel logs:**
```bash
tail -f storage/logs/laravel.log
```

**Clear all caches:**
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

**Run migrations:**
```bash
php artisan migrate --force
```

---

## 📞 NEED HELP?

If you're stuck, check:
1. **Laravel logs**: `storage/logs/laravel.log`
2. **Web server logs**: Via cPanel → Error Logs
3. **Test each step**: Don't skip verification tests

---

## ✅ FINAL CHECKLIST

- [ ] Connected to SSH successfully
- [ ] Generated APP_KEY
- [ ] Set storage permissions
- [ ] Ran database migrations
- [ ] Created .htaccess redirect
- [ ] Tested https://edeenapp.co.uk/api/login in browser
- [ ] Rebuilt APK
- [ ] Installed APK on device
- [ ] Tested login with forcann66@gmail.com

---

**Created**: June 15, 2026  
**Domain**: https://edeenapp.co.uk/  
**Backend**: Laravel 11.x on Hostinger  
**Database**: MySQL (u963776255_e_deen_app)
