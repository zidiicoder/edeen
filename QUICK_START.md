# Quick Start Guide - Deploy Edeen to App Store via Codemagic

## 🚀 5-Step Deployment Process

### Step 1: Push to GitHub (5 minutes)

Open Command Prompt or PowerShell:

```bash
cd "e:\edeen-application-main 2"
git push -u origin main
```

**Note:** You'll be asked for credentials:
- **Username:** zidiicoder
- **Password:** Use a Personal Access Token (not your GitHub password)

**Create Token:** https://github.com/settings/tokens
1. Click "Generate new token (classic)"
2. Select `repo` scope
3. Copy and use as password

---

### Step 2: Sign Up for Codemagic (2 minutes)

1. Go to https://codemagic.io/signup
2. Click "Sign up with GitHub"
3. Authorize with @zidiicoder account

---

### Step 3: Add Your App (1 minute)

1. In Codemagic dashboard: **"Add application"**
2. Select **GitHub**
3. Choose **zidiicoder/edeen**
4. Click **"Finish"**

Codemagic will automatically detect the `codemagic.yaml` file!

---

### Step 4: Configure Signing (15-20 minutes)

#### For iOS:

**A. Get App Store Connect API Key**
1. Go to https://appstoreconnect.apple.com
2. Users and Access → Keys → **+** button
3. Name: Codemagic CI
4. Access: App Manager
5. **Download .p8 file** (save it!)
6. Copy Issuer ID and Key ID

**B. Add to Codemagic**
1. Teams → Integrations → App Store Connect
2. Upload .p8 file
3. Enter Issuer ID and Key ID
4. Save as "Edeen App Store Connect"

#### For Android (if also deploying):

**A. Generate Keystore** (if you don't have one)
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore edeen-key.keystore -alias edeen-key -keyalg RSA -keysize 2048 -validity 10000
```
Save password securely!

**B. Add to Codemagic**
1. App Settings → Code signing → Android
2. Upload keystore file
3. Enter passwords
4. Reference name: `edeen_keystore`

---

### Step 5: Build & Deploy (30-45 minutes)

1. In Codemagic dashboard
2. Select **edeen** app
3. Click **"Start new build"**
4. Choose **"ios-production"** workflow
5. Branch: **main**
6. Click **"Start new build"**

**Monitor Progress:**
- Watch build logs in real-time
- You'll get email notification when complete
- App auto-submits to TestFlight!

---

## 📧 Notifications

Build notifications sent to: **zidiicoder@gmail.com**
- ✅ Build succeeded
- ❌ Build failed

---

## 🔍 Build Status

Check build at: https://codemagic.io/apps

---

## ⚡ That's It!

Once the build succeeds:
- **iOS:** App is on TestFlight automatically
- **Android:** App uploaded to Play Console Internal track

---

## 🆘 Need Help?

**Common Issues:**

**Git push fails?**
→ Use Personal Access Token, not password

**Build fails on Codemagic?**
→ Check that API keys are correctly entered

**Can't find .p8 file?**
→ You can only download it once from App Store Connect. Generate a new one if lost.

---

## 📚 More Info

- **Full Guide:** [CODEMAGIC_SETUP_GUIDE.md](./CODEMAGIC_SETUP_GUIDE.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Technical:** [TECHNICAL_REPORT.md](./TECHNICAL_REPORT.md)

---

**Ready? Let's go!** 🚀

Start with Step 1: Push to GitHub
