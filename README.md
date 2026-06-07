# Edeen

React Native mobile application for iOS and Android.

## Version
- **1.5.0 (Build 5)**
- iOS Bundle ID: `app.hashstack.edeen`
- Android Package: `com.edeen`

## Installation

```bash
npm install
cd ios && pod install && cd ..
```

## Run

```bash
# iOS
npm run ios

# Android
npm run android
```

## Build

### Local Development

```bash
# iOS
cd ios && xcodebuild archive -workspace edeen.xcworkspace -scheme edeen

# Android
cd android && ./gradlew assembleRelease
```

### CI/CD (Codemagic)

This project uses Codemagic for automated iOS and Android builds.

**Requirements:**
- Xcode 16.1 or higher for iOS builds
- iOS deployment target: 15.1
- Android deployment target: API 21

**Recent Fixes:**
- Xcode 16.1 compatibility for React Native 0.83.1
- Module system fixes for React-Runtime* targets
- Script phase output warnings suppressed
- Comprehensive build settings for iOS production builds

## Deployment

Builds are automatically deployed via Codemagic:
- **iOS**: Submitted to TestFlight via App Store Connect
- **Android**: Submitted to Google Play internal track

