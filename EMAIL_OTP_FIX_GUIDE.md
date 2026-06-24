# EDeen Email OTP Not Sending - Fix Guide

**Issue**: Users not receiving OTP emails during registration  
**Status**: OTP codes are being saved to database but emails are not being sent  
**Root Cause**: Missing SMTP credentials in .env configuration

---

## 🔍 Problem Analysis

### What's Happening
1. ✅ User creates account → API responds successfully
2. ✅ OTP code is generated (6-digit random number)
3. ✅ OTP is saved to `otp_codes` table in MySQL database
4. ❌ Email sending **FAILS SILENTLY** due to missing SMTP credentials
5. ❌ User never receives the email

### Why It's Failing Silently
The `issueOtp()` method in `AuthController.php` has a try-catch block:
```php
try {
    Mail::raw($body, function ($message) use ($email, $subject) {
        $message->to($email)->subject($subject);
    });
} catch (\Throwable $e) {
    // Mail not configured yet — log the code so verification still works in dev.
    Log::info("OTP for {$email} ({$purpose}): {$code}");
}
```

This catches all email errors and only logs them instead of notifying the user.

---

## ✅ Solution 1: Configure SMTP Credentials (RECOMMENDED)

### Step 1: Get SMTP Credentials from Hostinger

1. Login to Hostinger control panel: https://hpanel.hostinger.com
2. Go to **Emails** → **Email Accounts**
3. Find or create an email account: `no-reply@edeenapp.co.uk`
4. Get the SMTP credentials:
   - **SMTP Host**: `smtp.hostinger.com`
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Username**: Full email address (e.g., `no-reply@edeenapp.co.uk`)
   - **Password**: The email account password

### Step 2: Update .env File on Server

SSH into your server:
```bash
ssh -p 65002 u963776255@77.37.37.189
cd /home/u963776255/domains/edeenapp.co.uk/laravel
nano .env
```

Update these lines:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_USERNAME=no-reply@edeenapp.co.uk
MAIL_PASSWORD=your-actual-smtp-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@edeenapp.co.uk
MAIL_FROM_NAME="EDeen"
```

**Important**: Replace `your-actual-smtp-password` with the real password from Hostinger.

### Step 3: Clear Laravel Cache

```bash
cd /home/u963776255/domains/edeenapp.co.uk/laravel
php artisan config:clear
php artisan cache:clear
```

### Step 4: Test Email Sending

Run the test command:
```bash
cd /home/u963776255/domains/edeenapp.co.uk/laravel
php artisan tinker
```

Then in tinker:
```php
Mail::raw('Test email from EDeen', function ($message) {
    $message->to('your-test-email@gmail.com')
            ->subject('EDeen Test Email');
});
```

Press Ctrl+C to exit tinker.

Check your test email inbox (including spam folder).

---

## ✅ Solution 2: Use Alternative Email Service (If Hostinger SMTP Fails)

If Hostinger SMTP doesn't work reliably, consider using a dedicated transactional email service:

### Option A: SendGrid (Free tier: 100 emails/day)

1. Sign up at https://sendgrid.com
2. Create an API key
3. Update .env:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@edeenapp.co.uk
MAIL_FROM_NAME="EDeen"
```

### Option B: Mailgun (Free tier: 5,000 emails/month)

1. Sign up at https://mailgun.com
2. Verify your domain `edeenapp.co.uk`
3. Get SMTP credentials
4. Update .env accordingly

### Option C: Amazon SES (Very cheap, pay-as-you-go)

1. Sign up for AWS
2. Set up Amazon SES
3. Verify domain and email addresses
4. Get SMTP credentials
5. Update .env

---

## 🛠️ Solution 3: Improve Error Handling (Code Fix)

To prevent silent failures and provide better feedback to users, update the `issueOtp` method:

**File**: `backend/app/Http/Controllers/Api/AuthController.php`

```php
private function issueOtp(string $email, string $purpose): void
{
    $code = (string) random_int(100000, 999999);

    OtpCode::create([
        'email' => $email,
        'code' => $code,
        'purpose' => $purpose,
        'expires_at' => now()->addMinutes(10),
    ]);

    $subject = $purpose === 'reset' ? 'Your Edeen password reset code' : 'Your Edeen verification code';
    $body = "Your Edeen code is: {$code}\n\nIt expires in 10 minutes.";

    try {
        Mail::raw($body, function ($message) use ($email, $subject) {
            $message->to($email)->subject($subject);
        });
        
        // Log successful email sending
        Log::info("OTP email sent successfully to {$email} ({$purpose})");
        
    } catch (\Throwable $e) {
        // Log detailed error for debugging
        Log::error("Failed to send OTP email to {$email} ({$purpose}): " . $e->getMessage());
        Log::error("Stack trace: " . $e->getTraceAsString());
        
        // In development, also log the code
        if (config('app.debug')) {
            Log::info("OTP for {$email} ({$purpose}): {$code}");
        }
        
        // Re-throw the exception in production so the API can notify the user
        if (config('app.env') === 'production') {
            throw new \Exception("Failed to send verification email. Please contact support.");
        }
    }
}
```

This improved version:
- ✅ Logs successful email sends
- ✅ Logs detailed errors for debugging
- ✅ Throws exception in production (fails fast instead of silent failure)
- ✅ Only logs OTP code in development mode

---

## 🧪 Testing Steps

### 1. Test SMTP Connection
```bash
cd /home/u963776255/domains/edeenapp.co.uk/laravel
php test-mail-config.php
```

### 2. Check Laravel Logs
```bash
tail -f /home/u963776255/domains/edeenapp.co.uk/laravel/storage/logs/laravel.log
```

### 3. Test User Registration
- Open EDeen app
- Click "Sign Up"
- Enter test details:
  - Name: Test User
  - Email: your-test-email@gmail.com
  - Password: Test@123
- Submit and check:
  1. Email inbox (including spam)
  2. Database for OTP code
  3. Laravel logs for errors

### 4. Check Database
```bash
ssh -p 65002 u963776255@77.37.37.189
mysql -u u963776255_app_edeen -p u963776255_e_deen_app
# Enter password: tMee5Xis$xG.B27
```

Then:
```sql
SELECT * FROM otp_codes ORDER BY created_at DESC LIMIT 5;
```

---

## 📊 Current Configuration Status

**Domain**: edeenapp.co.uk  
**Server IP**: 77.37.37.189  
**Laravel Path**: `/home/u963776255/domains/edeenapp.co.uk/laravel/`

**Current .env Settings**:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_USERNAME=           ❌ EMPTY (THIS IS THE PROBLEM!)
MAIL_PASSWORD=           ❌ EMPTY (THIS IS THE PROBLEM!)
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@edeenapp.co.uk
MAIL_FROM_NAME=Edeen
```

---

## 🚨 Immediate Action Required

1. **Get SMTP credentials from Hostinger** for `no-reply@edeenapp.co.uk`
2. **Update .env file** on production server with username and password
3. **Clear Laravel cache**: `php artisan config:clear`
4. **Test email sending** using the tinker method
5. **Test user registration** from mobile app

---

## 📝 Alternative: Temporary Workaround (Development Only)

If you need to test immediately without email:

### Option: Use OTP from Database

1. User registers
2. Check database for OTP code:
```sql
SELECT code FROM otp_codes WHERE email='user@example.com' ORDER BY created_at DESC LIMIT 1;
```
3. Manually enter that code in the app

**Note**: This only works for testing. Production MUST have working email!

---

## 🔐 Security Notes

1. **Never commit .env file** to Git (already in .gitignore)
2. **Use strong SMTP password**
3. **Consider using app-specific password** if using Gmail/Yahoo
4. **Enable 2FA** on your email service for better security
5. **Monitor email sending logs** for suspicious activity

---

## 📞 Support Contacts

**Hostinger Support**: https://hpanel.hostinger.com/tickets  
**Email Issues**: Check Hostinger Email → Troubleshooter

---

## ✅ Success Checklist

- [ ] SMTP credentials obtained from Hostinger
- [ ] .env file updated on production server
- [ ] Laravel cache cleared
- [ ] Test email sent successfully via tinker
- [ ] User registration tested from app
- [ ] OTP email received in inbox
- [ ] User able to verify and complete registration

---

**Last Updated**: June 19, 2026  
**Issue Status**: Identified - Awaiting SMTP credentials  
**Priority**: CRITICAL - Blocking user registrations

