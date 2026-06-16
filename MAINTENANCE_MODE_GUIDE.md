# Edeen App - Maintenance Mode Guide

## 🚀 Current Status: MAINTENANCE MODE ACTIVE

Your domain **https://edeenapp.co.uk/** is now showing a professional maintenance page to all visitors.

---

## ✅ What Was Done

### 1. **Maintenance Page Created**
   - Beautiful, responsive maintenance page with animations
   - Shows "We'll Be Back Soon!" message
   - Professional gradient design with Edeen branding
   - Mobile-friendly layout

### 2. **Files Deployed to Server**
   - **Location**: `/home/u963776255/domains/edeenapp.co.uk/public_html/`
   - **New file**: `maintenance.html` (7.2 KB)
   - **Modified**: `.htaccess` (configured for maintenance mode)

### 3. **Backups Created**
   - ✅ `.htaccess.backup` - Original Apache configuration
   - ✅ `index.php.backup` - Original Laravel entry point
   
   **Important**: These backups are on the server and ready to restore anytime!

### 4. **API Still Working** 🔥
   - Your mobile app's API endpoints at `/api/*` are **NOT affected**
   - Users can still use the mobile app normally
   - Only the website shows the maintenance page

---

## 🌐 Test Your Maintenance Page

**Visit**: https://edeenapp.co.uk/

You should see:
- ✅ Purple gradient background
- ✅ "We'll Be Back Soon!" heading
- ✅ Animated gears/cogs
- ✅ Progress bar animation
- ✅ Social media icons
- ✅ Professional, modern design

**Test API** (should still work):
- https://edeenapp.co.uk/api/salah/current-upcoming?latitude=30.8081&longitude=73.4534

---

## 🔄 How to Restore Your Site (Remove Maintenance Mode)

When you're ready to bring the site back online, you have **3 easy options**:

### Option 1: Using PowerShell Script (Windows - Recommended)

```powershell
.\restore-site.ps1
```

### Option 2: Using Bash Script (Linux/Mac)

```bash
chmod +x restore-site.sh
./restore-site.sh
```

### Option 3: Manual SSH Command

```bash
ssh -p 65002 u963776255@77.37.37.189
cd /home/u963776255/domains/edeenapp.co.uk/public_html
cp .htaccess.backup .htaccess
exit
```

**That's it!** Your site will be back online immediately.

---

## 📁 Server File Structure

```
/home/u963776255/domains/edeenapp.co.uk/
├── laravel/                           # Your Laravel application
└── public_html/                       # Public web root
    ├── .htaccess                      # ACTIVE: Maintenance mode config
    ├── .htaccess.backup              # BACKUP: Original Laravel config
    ├── index.php                      # Laravel entry point
    ├── index.php.backup              # BACKUP: Laravel entry point
    ├── maintenance.html               # NEW: Maintenance page
    └── storage/                       # Symlink to Laravel storage
```

---

## 🔧 SSH Connection Details

- **Host**: 77.37.37.189
- **Port**: 65002
- **Username**: u963776255
- **Password**: v_#8TqmW#PA3V*T

**Connect manually**:
```bash
ssh -p 65002 u963776255@77.37.37.189
```

---

## 📝 Current .htaccess Configuration

The maintenance mode `.htaccess` is configured to:

✅ **Allow**:
- `/api/*` - All API endpoints (mobile app continues working)
- `/storage/*` - Images and storage files
- `/maintenance.html` - The maintenance page itself

❌ **Redirect to Maintenance**:
- `/` - Homepage
- All other pages and routes

**HTTP Status**: Returns `503 Service Unavailable` (proper status for maintenance)

---

## 🎨 Customizing the Maintenance Page

To update the maintenance message or design:

1. Edit `maintenance.html` locally
2. Upload to server:
   ```bash
   scp -P 65002 maintenance.html u963776255@77.37.37.189:/home/u963776255/domains/edeenapp.co.uk/public_html/
   ```

**Common customizations**:
- Update the message text
- Change colors (search for `#667eea` and `#764ba2`)
- Add social media links
- Update contact email

---

## ⚠️ Important Notes

1. **API is NOT affected** - Your mobile app will continue to work normally
2. **Backups are safe** - Original files are backed up on the server
3. **No data loss** - Only the `.htaccess` file was modified, nothing deleted
4. **Instant restore** - Run restore script anytime to bring site back
5. **Cache cleared** - Maintenance page has no-cache headers for instant updates

---

## 🚨 Troubleshooting

### Issue: Still seeing old site
**Solution**: Clear browser cache or try incognito mode

### Issue: API not working
**Solution**: Check if `/api/` endpoints are excluded in `.htaccess`

### Issue: Want to test without affecting users
**Solution**: Visit `https://edeenapp.co.uk/maintenance.html` directly

### Issue: Need to restore immediately
**Solution**: Run `.\restore-site.ps1` or manual SSH command above

---

## 📞 Quick Actions

| Action | Command |
|--------|---------|
| **Check if maintenance is active** | Visit https://edeenapp.co.uk/ |
| **Test API is working** | Visit https://edeenapp.co.uk/api/salah/current-upcoming?latitude=30.8081&longitude=73.4534 |
| **Restore site** | `.\restore-site.ps1` |
| **View backup files** | `ssh -p 65002 u963776255@77.37.37.189 "ls -la domains/edeenapp.co.uk/public_html/"` |
| **Re-upload maintenance page** | `scp -P 65002 maintenance.html u963776255@77.37.37.189:/home/u963776255/domains/edeenapp.co.uk/public_html/` |

---

## ✅ Summary

- ✅ Maintenance page is **LIVE** at https://edeenapp.co.uk/
- ✅ Mobile app API is **STILL WORKING**
- ✅ Original files are **SAFELY BACKED UP**
- ✅ Restore scripts are **READY TO USE**
- ✅ One command to **BRING SITE BACK ONLINE**

---

**Created**: June 16, 2026  
**Status**: Maintenance Mode Active  
**Restore**: Run `.\restore-site.ps1` anytime

