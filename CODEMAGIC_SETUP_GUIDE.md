# Codemagic CI/CD Setup Guide for Edeen App

## Project Information
- **App Name:** Edeen
- **Version:** 1.5.0
- **Build Number:** 5
- **iOS Bundle ID:** app.hashstack.edeen
- **Android Package:** com.edeen
- **GitHub Repository:** https://github.com/zidiicoder/edeen
- **GitHub Username:** zidiicoder

---

## Prerequisites

### 1. Apple Developer Account
- Active Apple Developer Program membership ($99/year)
- Access to App Store Connect
- App already created in App Store Connect with Bundle ID: `app.hashstack.edeen`

### 2. Google Play Console
- Active Google Play Developer account
- App already created or ready to create

### 3. GitHub Repository
- Repository: https://github.com/zidiicoder/edeen
- Push access to the repository

---

## Step 1: Push Code to GitHub

### Initialize Git (if not already done)
```bash
cd "e:\edeen-application-main 2"
git init
git add .
git commit -m "Initial commit - Version 1.5.0 ready for production"
```

### Add Remote and Push
```bash
git remote add origin https://github.com/zidiicoder/edeen.git
git branch -M main
git push -u origin main
```

---

## Step 2: Sign Up for Codemagic

1. Go to https://codemagic.io/signup
2. Sign up using your GitHub account (@zidiicoder)
3. Authorize Codemagic to access your repositories

---

## Step 3: Add Your App to Codemagic

1. In Codemagic dashboard, click **"Add application"**
2. Select **GitHub** as the source
3. Choose the repository: **zidiicoder/edeen**
4. Codemagic will automatically detect `codemagic.yaml` in your repo
5. Click **"Finish: Add application"**

---

## Step 4: Configure iOS Signing

### A. Generate App Store Connect API Key

1. Go to https://appstoreconnect.apple.com
2. Navigate to **Users and Access** → **Keys** (under Integrations)
3. Click **"+"** to generate a new API Key
4. **Name:** Codemagic CI
5. **Access:** App Manager or Developer
6. Click **"Generate"**
7. **Download the .p8 file** (only available once!)
8. Note down:
   - **Issuer ID** (found at top of page)
   - **Key ID** (in the keys list)

### B. Add API Key to Codemagic

1. In Codemagic, go to **Teams** → **Integrations**
2. Click **"App Store Connect"**
3. Enter:
   - **Issuer ID:** (from step A)
   - **Key ID:** (from step A)
   - **API Key:** (upload the .p8 file)
4. Give it a name: **"Edeen App Store Connect"**
5. Click **"Save"**

### C. Generate iOS Certificates and Provisioning Profiles

**Option 1: Automatic (Recommended)**
Codemagic will automatically generate certificates when you run the first build.

**Option 2: Manual**
1. Go to https://developer.apple.com/account/resources/certificates/
2. Create **iOS Distribution Certificate**
3. Create **App Store Provisioning Profile** for `app.hashstack.edeen`
4. Download and add to Codemagic

---

## Step 5: Configure Android Signing

### A. Generate Upload Keystore (if not already have)

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore edeen-upload-key.keystore \
  -alias edeen-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STRONG_PASSWORD \
  -keypass YOUR_STRONG_PASSWORD \
  -dname "CN=Edeen App, OU=Mobile, O=HashStack, L=City, ST=State, C=US"
```

**IMPORTANT:** Save this keystore file securely! You cannot recover it if lost.

### B. Add Keystore to Codemagic

1. In Codemagic, go to your app settings
2. Navigate to **Code signing identities** → **Android**
3. Click **"Add key"**
4. Upload `edeen-upload-key.keystore`
5. Enter:
   - **Keystore password:** (your password)
   - **Key alias:** edeen-key-alias
   - **Key password:** (your password)
6. Reference name: **edeen_keystore**
7. Click **"Save"**

### C. Set Up Google Play Service Account

1. Go to https://play.google.com/console
2. Navigate to **Setup** → **API access**
3. Link your Google Cloud project or create new one
4. Click **"Create new service account"**
5. Follow Google Cloud Console link
6. Create service account:
   - **Name:** Codemagic CI
   - **Role:** Service Account User
7. Create JSON key and download it
8. Back in Play Console, grant access to the service account
9. Set permissions: **Release to production, testing tracks**

### D. Add Service Account to Codemagic

1. In Codemagic, go to **Teams** → **Integrations**
2. Click **"Google Play"**
3. Upload the JSON key file
4. Reference name: **google_play**
5. Click **"Save"**

---

## Step 6: Environment Variables

### In Codemagic App Settings → Environment Variables

Add the following variables:

#### iOS Variables
```
APP_STORE_ID=<your_app_store_id>
APP_STORE_CONNECT_ISSUER_ID=<from_step_4>
APP_STORE_CONNECT_KEY_IDENTIFIER=<from_step_4>
APP_STORE_CONNECT_PRIVATE_KEY=<from_step_4>
```

#### Android Variables
```
GPLAY_SERVICE_ACCOUNT_CREDENTIALS=<json_key_content>
```

---

## Step 7: Configure Workflows

The `codemagic.yaml` file in your repository already contains two workflows:

### 1. `ios-production`
- Builds iOS app for App Store
- Automatically signs with your certificates
- Submits to TestFlight
- Can be configured to submit to App Store

### 2. `android-production`
- Builds Android App Bundle (.aab)
- Signs with your keystore
- Uploads to Google Play (internal track)

---

## Step 8: Trigger Your First Build

### Automatic Build (on push)
Simply push to your `main` branch:
```bash
git add .
git commit -m "Trigger Codemagic build"
git push origin main
```

### Manual Build
1. Go to Codemagic dashboard
2. Select your app
3. Click **"Start new build"**
4. Choose workflow: **ios-production** or **android-production**
5. Select branch: **main**
6. Click **"Start new build"**

---

## Step 9: Monitor Build Progress

1. Go to https://codemagic.io/apps
2. Click on **edeen** app
3. View build logs in real-time
4. Check for any errors
5. Download artifacts (IPA/AAB) when complete

---

## Build Notifications

You will receive email notifications at **zidiicoder@gmail.com** for:
- ✅ Successful builds
- ❌ Failed builds

---

## Troubleshooting

### iOS Build Fails
- **Certificate Issues:** Check App Store Connect API key is valid
- **Provisioning Profile:** Ensure Bundle ID matches `app.hashstack.edeen`
- **CocoaPods:** Check if `Podfile.lock` is committed

### Android Build Fails
- **Keystore Issues:** Verify keystore password and alias
- **Google Play:** Check service account has correct permissions
- **Gradle:** Ensure `google-services.json` is committed

### Common Issues
- **Node modules:** Delete `node_modules` and run `npm install`
- **iOS Pods:** Delete `ios/Pods` and run `pod install`
- **Android:** Clean with `cd android && ./gradlew clean`

---

## Important Files in Repository

### Configuration Files
- ✅ `codemagic.yaml` - CI/CD configuration
- ✅ `package.json` - Version 1.5.0
- ✅ `ios/edeen.xcodeproj/project.pbxproj` - iOS project config
- ✅ `android/app/build.gradle` - Android config

### iOS Files
- ✅ `ios/Podfile` - CocoaPods dependencies
- ✅ `ios/edeen/Info.plist` - iOS app info
- ✅ `ios/edeen/AppDelegate.swift` - Main iOS entry point

### Android Files
- ✅ `android/app/google-services.json` - Firebase config
- ✅ `android/app/build.gradle` - Build configuration
- ✅ `android/app/src/main/AndroidManifest.xml` - App manifest

### Source Code
- ✅ `index.js` - App entry point
- ✅ `App.js` - Main app wrapper
- ✅ `src/` - Application source code

---

## Version Management

### Current Version
- **Version:** 1.5.0
- **iOS Build:** 5
- **Android Version Code:** 5

### Updating Version for Next Release

1. Update `package.json`:
```json
"version": "1.6.0"
```

2. Update `android/app/build.gradle`:
```gradle
versionCode 6
versionName "1.6.0"
```

3. Update iOS version:
```bash
cd ios
agvtool new-marketing-version 1.6.0
agvtool new-version -all 6
```

---

## Security Best Practices

### ✅ DO
- Keep your API keys secure
- Use environment variables in Codemagic
- Backup your keystores securely
- Use strong passwords
- Enable 2FA on Apple/Google accounts

### ❌ DON'T
- Commit keystores to Git
- Share API keys publicly
- Use weak passwords
- Disable code signing verification

---

## Cost Information

### Codemagic Free Tier
- 500 build minutes per month
- Single concurrent build
- Suitable for small teams

### Codemagic Pro (Recommended for Production)
- $95/month
- Unlimited build minutes
- Multiple concurrent builds
- Priority support

### Apple
- Developer Program: $99/year

### Google
- Play Console: $25 one-time fee

---

## Next Steps After First Successful Build

### iOS
1. Build will be uploaded to TestFlight automatically
2. Invite beta testers in App Store Connect
3. Collect feedback
4. When ready, submit to App Store from App Store Connect

### Android
1. Build will be uploaded to Internal Testing track
2. Promote to Alpha/Beta testing
3. Collect feedback
4. When ready, promote to Production

---

## Support & Resources

### Codemagic
- Documentation: https://docs.codemagic.io/
- Support: support@codemagic.io
- Slack Community: https://codemagic-community.slack.com/

### Apple
- App Store Connect: https://appstoreconnect.apple.com
- Developer Portal: https://developer.apple.com

### Google
- Play Console: https://play.google.com/console
- Firebase Console: https://console.firebase.google.com

---

## Quick Reference Commands

### Git Commands
```bash
# Check status
git status

# Add all files
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin main

# Create and switch to new branch
git checkout -b feature/new-feature

# View remote URL
git remote -v
```

### iOS Commands
```bash
# Install pods
cd ios && pod install

# Update pods
cd ios && pod update

# Clean build
cd ios && xcodebuild clean
```

### Android Commands
```bash
# Clean build
cd android && ./gradlew clean

# Build debug
cd android && ./gradlew assembleDebug

# Build release
cd android && ./gradlew assembleRelease
```

---

**Document Created:** June 1, 2026  
**App Version:** 1.5.0  
**Status:** Ready for Codemagic Deployment  
**GitHub:** https://github.com/zidiicoder/edeen
