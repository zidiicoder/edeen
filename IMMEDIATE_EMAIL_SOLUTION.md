# EDeen Email - IMMEDIATE Solution Required

**STATUS**: SMTP credentials are correct ✅ BUT Hostinger is BLOCKING your server's IP ❌

**Error**: `554 5.7.1 Client host rejected: Access denied`

---

## 🚨 The Problem

Hostinger SMTP server (`smtp.hostinger.com`) is **blocking connections** from your server's IP address:
- IPv4: `77.37.37.189`
- IPv6: `2a02:4780:a:1692:0:3972:eff:1`

This is a security measure by Hostinger to prevent spam.

---

## ✅ SOLUTION 1: Use Gmail SMTP (5 minutes - FASTEST)

Gmail SMTP is more reliable and allows external connections.

### Step 1: Create App Password in Gmail

1. Go to: https://myaccount.google.com/apppasswords
2. Login to your Google account
3. Click "Create" or "+ Generate app password"
4. Name it: "EDeen App"
5. Copy the 16-character password (example: `abcd efgh ijkl mnop`)

### Step 2: Update Server Configuration

Run this on your computer:

```powershell
ssh -p 65002 u963776255@77.37.37.189
cd /home/u963776255/domains/edeenapp.co.uk/laravel
nano .env
```

Change mail settings to:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=abcd-efgh-ijkl-mnop
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-gmail@gmail.com
MAIL_FROM_NAME=EDeen
```

Save (Ctrl+O, Enter, Ctrl+X)

### Step 3: Test

```bash
# Still in SSH
cd /home/u963776255/domains/edeenapp.co.uk/laravel
# Try registering a user in the app
```

---

## ✅ SOLUTION 2: Fix Hostinger Access (Contact Support)

### Open Support Ticket

1. Go to: https://hpanel.hostinger.com/tickets
2. Click "New Ticket"
3. Copy-paste this message:

```
Subject: SMTP Access Denied - Need IP Whitelist

Hello Hostinger Support,

I'm getting "554 5.7.1 Client host rejected: Access denied" when trying 
to send emails via SMTP from my Laravel application.

Domain: edeenapp.co.uk
Email account: no-reply@edeenapp.co.uk
Server IPv4: 77.37.37.189
Server IPv6: 2a02:4780:a:1692:0:3972:eff:1

Please whitelist my server's IP address for SMTP access on port 587 or 465.

I need this urgently for user registration OTP emails in my mobile app.

Thank you!
```

**Expected Response Time**: 2-24 hours

---

## ✅ SOLUTION 3: Use SendGrid (Free - 100 emails/day)

SendGrid is specifically designed for transactional emails like OTP codes.

### Step 1: Create SendGrid Account

1. Go to: https://signup.sendgrid.com/
2. Sign up for free account
3. Verify your email

### Step 2: Create API Key

1. Go to: https://app.sendgrid.com/settings/api_keys
2. Click "Create API Key"
3. Name it: "EDeen App"
4. Choose "Restricted Access" → Select "Mail Send" → Full Access
5. Click "Create & View"
6. Copy the API key (starts with `SG.`)

### Step 3: Verify Sender Identity

1. Go to: https://app.sendgrid.com/settings/sender_auth
2. Click "Verify a Single Sender"
3. Fill form:
   - From Name: EDeen
   - From Email: no-reply@edeenapp.co.uk
   - Reply To: Same or your support email
4. Check your email and click verification link

### Step 4: Update Server Configuration

```powershell
ssh -p 65002 u963776255@77.37.37.189
cd /home/u963776255/domains/edeenapp.co.uk/laravel
nano .env
```

Change to:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.your-api-key-here
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@edeenapp.co.uk
MAIL_FROM_NAME=EDeen
```

---

## ✅ SOLUTION 4: Use Mailgun (Free - 5,000 emails/month)

### Quick Setup:

1. Sign up: https://signup.mailgun.com/
2. Add domain: `edeenapp.co.uk`
3. Follow DNS verification steps
4. Get SMTP credentials from dashboard
5. Update .env file on server

---

## 🎯 RECOMMENDED: Use Gmail (Fastest - 5 minutes)

Gmail SMTP works immediately without IP whitelisting issues.

**Pros**:
- ✅ Works instantly
- ✅ No IP restrictions
- ✅ Free (up to 500 emails/day)
- ✅ Reliable delivery
- ✅ Good reputation (won't go to spam)

**Cons**:
- ⚠️ Emails appear "from" your Gmail address
- ⚠️ Need to create app-specific password

---

## 📊 Current Status

**What's Working**:
- ✅ User registration API
- ✅ OTP code generation
- ✅ OTP saved to database
- ✅ SMTP credentials configured
- ✅ Laravel trying to send emails

**What's Broken**:
- ❌ Hostinger blocking SMTP connections
- ❌ Emails not being delivered

**OTP codes in logs (for manual verification)**:
- test.otp.001501@example.com: `566290`
- test.otp.001629@example.com: `621610`

---

## 🚀 Quick Action Plan

**FASTEST (5 min)**: Use Gmail SMTP
1. Create Gmail app password
2. Update .env on server
3. Test registration

**BEST (24 hours)**: Contact Hostinger support
1. Open ticket to whitelist IP
2. Wait for response
3. Test when approved

**ALTERNATIVE (15 min)**: Use SendGrid
1. Create free account
2. Verify sender
3. Get API key
4. Update .env

---

## 📞 Need Help?

If you want me to update the configuration once you have Gmail app password or SendGrid API key, just provide them and I'll update the server immediately.

**Your Current Server Details**:
- SSH: u963776255@77.37.37.189:65002
- Laravel: /home/u963776255/domains/edeenapp.co.uk/laravel/
- .env file: Already has correct structure, just needs working SMTP

---

**Last Test**: June 19, 2026 19:16  
**Status**: SMTP blocked by Hostinger  
**Action Required**: Choose one of the 4 solutions above

