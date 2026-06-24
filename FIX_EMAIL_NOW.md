# ⚡ Fix Email OTP Issue - Quick Start (10 Minutes)

## 🎯 The Problem
Users registering in EDeen app are NOT receiving OTP verification emails.

**Root Cause**: Missing SMTP credentials in server configuration.

---

## ✅ The Solution (3 Easy Steps)

### Step 1: Get Your Email Password (3 minutes)

1. Open browser and go to: **https://hpanel.hostinger.com**
2. Login to your Hostinger account
3. Click **Emails** in the left menu
4. Click **Email Accounts**
5. Find or create email: **no-reply@edeenapp.co.uk**
6. Click the **⚙️ Manage** button next to the email
7. Copy or note down:
   - **Email address**: no-reply@edeenapp.co.uk
   - **Password**: (use existing or click "Change Password" to set new one)

---

### Step 2: Run the Fix Script (2 minutes)

Open PowerShell and run:

```powershell
cd e:\edeen
.\fix-email-config.ps1
```

When prompted:
- **Enter SMTP username**: `no-reply@edeenapp.co.uk`
- **Enter SMTP password**: (paste the password from Step 1)
- **Proceed?**: Type `yes` and press Enter

The script will:
- ✅ Connect to your server
- ✅ Update email settings
- ✅ Clear Laravel cache
- ✅ Confirm success

---

### Step 3: Test It (2 minutes)

**Test via command line:**
```powershell
ssh -p 65002 u963776255@77.37.37.189 "cd /home/u963776255/domains/edeenapp.co.uk/laravel && php artisan email:test YOUR-EMAIL@gmail.com"
```
Replace `YOUR-EMAIL@gmail.com` with your actual email.

**Or test in mobile app:**
1. Open EDeen app
2. Try to register a new test account
3. Check your email inbox (and spam folder)
4. You should receive OTP within 5 seconds!

---

## 🎉 Done!

If you received the test email, the problem is FIXED! ✅

All new users will now receive OTP verification emails during registration.

---

## 🆘 Still Not Working?

### Quick Checks:

1. **Verify you entered correct password**:
   - Try logging into webmail: https://webmail.hostinger.com
   - Username: no-reply@edeenapp.co.uk
   - If login fails, password is wrong

2. **Check Laravel logs**:
   ```powershell
   ssh -p 65002 u963776255@77.37.37.189 "tail -n 50 /home/u963776255/domains/edeenapp.co.uk/laravel/storage/logs/laravel.log"
   ```
   Look for error messages about email sending

3. **Re-run the config script**:
   ```powershell
   cd e:\edeen
   .\fix-email-config.ps1
   ```
   Double-check the password this time

4. **Read full guide**:
   Open `EMAIL_OTP_FIX_GUIDE.md` for detailed troubleshooting

---

## 📝 What If I Don't Have the Email Account?

Create it in Hostinger:

1. Go to: https://hpanel.hostinger.com
2. Click **Emails** → **Email Accounts**
3. Click **Create Email Account**
4. Enter:
   - **Email**: no-reply
   - **Domain**: edeenapp.co.uk
   - **Password**: Create a strong password
5. Click **Create**
6. Now go back to Step 2 above

---

## 💡 Pro Tip

After fixing, you can view OTP codes in Laravel logs if needed:

```powershell
ssh -p 65002 u963776255@77.37.37.189 "grep 'OTP email' /home/u963776255/domains/edeenapp.co.uk/laravel/storage/logs/laravel.log | tail -10"
```

This shows the last 10 OTP emails sent (useful for debugging).

---

## ✅ Success Checklist

- [ ] Got SMTP password from Hostinger
- [ ] Ran fix-email-config.ps1 script
- [ ] Script confirmed "Configuration updated successfully"
- [ ] Sent test email via artisan command
- [ ] Received test email in inbox
- [ ] Tested user registration in mobile app
- [ ] User received OTP email
- [ ] User successfully verified and logged in

---

**Need Help?**
- Full guide: `EMAIL_OTP_FIX_GUIDE.md`
- Summary: `EMAIL_ISSUE_SUMMARY.md`

**Time to fix**: ⏱️ 10 minutes  
**Difficulty**: ⭐ Easy (just copy/paste)  
**Priority**: 🔴 CRITICAL

