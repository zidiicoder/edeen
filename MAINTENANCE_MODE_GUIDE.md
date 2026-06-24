# EDeen Maintenance Mode Guide

## ✅ Maintenance Mode is NOW ACTIVE

**Status**: Website shows maintenance page, but mobile app API continues working normally.

---

## What's Working

✅ **Mobile App**: Fully functional - all API routes (`/api/*`) are accessible
✅ **API Endpoints**: Login, prayer times, tracking, etc. all working
✅ **Storage/Images**: All media files accessible

## What's Showing Maintenance

🔧 **Website Visitors**: Will see the maintenance page when visiting edeenapp.co.uk

---

## Files on Server

**Location**: `/home/u963776255/domains/edeenapp.co.uk/public_html/`

- `maintenance.html` - The maintenance page displayed to visitors
- `.htaccess` - Current active configuration (maintenance mode)
- `.htaccess.before-maintenance` - Backup of previous .htaccess (before this activation)
- `.htaccess.backup` - Original backup

---

## How to DISABLE Maintenance Mode

### Option 1: Via SSH Command

```bash
ssh -p 65002 u963776255@77.37.37.189
cd /home/u963776255/domains/edeenapp.co.uk/public_html
cp .htaccess.before-maintenance .htaccess
```

### Option 2: Via FTP/File Manager

1. Connect to your server via FTP or cPanel File Manager
2. Navigate to: `/home/u963776255/domains/edeenapp.co.uk/public_html/`
3. Rename `.htaccess` to `.htaccess.maintenance-backup`
4. Rename `.htaccess.before-maintenance` to `.htaccess`
5. Done! Website is back online

### Option 3: One-Line PowerShell Command (from your Windows machine)

```powershell
ssh -p 65002 u963776255@77.37.37.189 "cp /home/u963776255/domains/edeenapp.co.uk/public_html/.htaccess.before-maintenance /home/u963776255/domains/edeenapp.co.uk/public_html/.htaccess && echo 'Maintenance mode DISABLED - Website is back online!'"
```

---

## How to RE-ENABLE Maintenance Mode Later

### Via SSH:
```bash
ssh -p 65002 u963776255@77.37.37.189
cd /home/u963776255/domains/edeenapp.co.uk/public_html
cp .htaccess.maintenance .htaccess
```

### Via PowerShell (from Windows):
```powershell
ssh -p 65002 u963776255@77.37.37.189 "cp /home/u963776255/domains/edeenapp.co.uk/public_html/.htaccess.maintenance /home/u963776255/domains/edeenapp.co.uk/public_html/.htaccess && echo 'Maintenance mode ACTIVATED!'"
```

---

## Testing

### Test Website (should show maintenance):
- Open browser: https://edeenapp.co.uk
- Expected: Maintenance page with purple gradient background

### Test Mobile App (should work normally):
- Open EDeen app on your phone
- Try logging in
- Check prayer times, tracking features
- Expected: Everything works normally

### Test API Directly:
```bash
curl https://edeenapp.co.uk/api/salah/current-upcoming
```
Expected: JSON response (not maintenance page)

---

## Important Notes

⚠️ **DO NOT delete** `.htaccess.before-maintenance` - you need this to restore normal operation!

💡 The maintenance setup is **smart** - it only affects website visitors, not your mobile app users.

🔒 All your API routes are protected and continue to work during maintenance.

---

## Server Details

- **Domain**: edeenapp.co.uk
- **IP**: 77.37.37.189
- **SSH Port**: 65002
- **Username**: u963776255
- **Public HTML Path**: `/home/u963776255/domains/edeenapp.co.uk/public_html/`
- **Laravel Path**: `/home/u963776255/domains/edeenapp.co.uk/laravel/`

---

## Need Help?

If you encounter any issues:

1. **Check .htaccess file** - Make sure it exists and has correct permissions (644)
2. **Check error logs** - SSH: `tail -f /home/u963776255/domains/edeenapp.co.uk/logs/error.log`
3. **Restore from backup** - Use `.htaccess.before-maintenance` to go back

---

**Last Updated**: June 19, 2026
**Maintenance Mode Activated**: Yes ✅
**Mobile App Status**: Working ✅
