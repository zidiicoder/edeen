# EDeen Email SMTP Blocked - Fix Guide

**Issue Found**: Hostinger SMTP server is rejecting connections from your server  
**Error**: `554 5.7.1 Client host rejected: Access denied`  
**Server IPv6**: `2a02:4780:a:1692:0:3972:eff:1`

---

## 🔍 What's Happening

1. ✅ SMTP credentials are NOW configured correctly
   - Username: `no-reply@edeenapp.co.uk`
   - Password: Set correctly
2. ✅ Laravel is trying to send emails
3. ❌ **Hostinger SMTP server is BLOCKING your server's IP address**
4. ❌ Users not receiving emails

### Error from Laravel logs:
```
[2026-06-19 19:15:02] production.ERROR: ❌ Failed to send OTP email 
{"email":"test.otp.001501@example.com","purpose":"verify","code":"566290",
"error":"Expected response code \"250/251/252\" but got code \"554\", 
with message \"554 5.7.1 <unknown[2a02:4780:a:1692:0:3972:eff:1]>: 
Client host rejected: Access denied\"."}
```

---

## ✅ Solution: Enable SMTP Access in Hostinger

### Step 1: Login to Hostinger Control Panel (2 minutes)

1. Go to: https://hpanel.hostinger.com
2. Login to your account
3. Navigate to: **Emails** → **Email Accounts**

### Step 2: Configure SMTP Access (3 minutes)

**Option A: Enable "Allow Less Secure Apps" (if available)**
1. Click on the **⚙️ Manage** button next to `no-reply@edeenapp.co.uk`
2. Look for security settings or SMTP access settings
3. Enable "Allow external applications" or "SMTP access"
4. Save changes

**Option B: Whitelist Server IP (recommended)**
1. In Hostinger panel, go to **Email** settings
2. Look for "SMTP Restrictions" or "Allowed IP Addresses"
3. Add your server's IPv6 address: `2a02:4780:a:1692:0:3972:eff:1`
4. Or add the IPv4 address: `77.37.37.189`
5. Save changes

**Option C: Contact Hostinger Support**
If you can't find these settings:
1. Open a support ticket: https://hpanel.hostinger.com/tickets
2. Tell them:
   ```
   Subject: Enable SMTP access for no-reply@edeenapp.co.uk
   
   Hello,
   
   I need to send emails from my Laravel application using SMTP, 
   but I'm getting error "554 5.7.1 Client host rejected: Access denied".
   
   Email account: no-reply@edeenapp.co.uk
   Server IP: 77.37.37.189
   IPv6: 2a02:4780:a:1692:0:3972:eff:1
   
   Please whitelist this IP address for SMTP access.
   
   Thank you!
   ```

---

## 🎯 Alternative Solution: Use Port 465 with SSL

Some SMTP servers are less restrictive on port 465. Let me update your configuration:

<function_calls>
<invoke name="execute_pwsh">
<parameter name="command">ssh -p 65002 u963776255@77.37.37.189 "cd /home/u963776255/domains/edeenapp.co.uk/laravel && cp .env .env.backup-port-change && sed -i 's/^MAIL_PORT=.*/MAIL_PORT=465/' .env && sed -i 's/^MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=ssl/' .env && echo 'Changed to port 465 with SSL'"