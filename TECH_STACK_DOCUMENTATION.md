# Edeen App - Complete Tech Stack Documentation

## 📱 FRONTEND STACK

### **Platform & Framework**
- **React Native**: 0.83.9 (Latest version you're using - previously 0.80.0)
- **React**: 19.2.0
- **Node.js**: >= 20
- **Build Tools**:
  - iOS: Xcode 16.1+
  - Android: Gradle

### **Navigation & Routing**
- `@react-navigation/native`: ^6.1.18
- `@react-navigation/native-stack`: ^6.11.0
- `@react-navigation/bottom-tabs`: ^6.6.1
- `@react-navigation/drawer`: ^6.7.2

### **State Management & Storage**
- **Local Storage**: `@react-native-async-storage/async-storage`: ^3.1.1
- **Context API**: Built-in React Context for AuthContext

### **HTTP Client & API**
- **Axios**: ^1.7.9 (For REST API communication)
- **API Base URL**: `https://edeen.innovationpixel.com/public/api/`

### **UI & Styling**
- **Native Components**: React Native built-in
- **Icons**: `react-native-vector-icons`: ^10.3.0
- **Gestures**: `react-native-gesture-handler`: ^3.0.1
- **Animations**: `react-native-reanimated`: ^4.4.1
- **Safe Area**: `react-native-safe-area-context`: ^5.8.0
- **Screens**: `react-native-screens`: ^4.25.2

### **Form Validation**
- **Yup**: ^1.4.0 (Schema-based form validation)

### **Push Notifications**
- `@react-native-firebase/app`: ^24.1.1
- `@react-native-firebase/messaging`: ^24.1.1
- `@notifee/react-native`: ^9.1.8 (Local notifications)

### **Device Features**
- **Geolocation**: `@react-native-community/geolocation`: ^3.4.0
- **Image Picker**: `react-native-image-picker`: ^8.2.1
- **Haptic Feedback**: Built-in React Native Vibration API
- **WebView**: `react-native-webview`: ^13.16.1

### **Rich Text & Emoji**
- `react-native-pell-rich-editor`: ^1.10.0
- `rn-emoji-keyboard`: ^1.7.0

### **Build Configuration**
- **TypeScript Support**: ^5.8.3
- **Babel**: ^7.25.2
- **ESLint**: ^8.19.0
- **Prettier**: ^3.4.2
- **Patch Package**: ^8.0.1 (For patching node_modules)

---

## 🔧 BACKEND STACK (Based on API Analysis)

### **Framework**
**Laravel** (PHP Framework)

**Evidence:**
- API URL structure: `public/api/` (Laravel convention)
- Error handling in code shows Laravel validation error format:
  ```javascript
  // From src/utils/index.js
  if (error.response?.data?.errors) {
    const apiErrors = error.response.data.errors;
    Object.keys(apiErrors).forEach((key) => {
      normalizedErrors[key] = apiErrors[key][0]; // Laravel returns array of errors
    });
  }
  ```
- FormData usage pattern matches Laravel expectation

### **Authentication**
- **Bearer Token Authentication**: JWT-style access tokens
- Token stored in AsyncStorage as `access_token`
- Auth interceptor adds `Authorization: Bearer {token}` header

### **API Endpoints Identified**

#### Authentication Endpoints:
- `POST /login` - User login with email & password
- `POST /signup` - User registration
- `POST /logout` - User logout
- `POST /verify` - OTP verification
- `GET /get-otp` - Request OTP
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Complete password reset
- `POST /resend-otp` - Resend OTP
- `PUT /device-token` - Update FCM device token

#### User Profile Endpoints:
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /change-password` - Change password

#### Habit Tracker Endpoints:
- `GET /habits` - Get all habits
- `POST /habits` - Create new habit
- `PUT /habits/{id}` - Update habit
- `DELETE /habits/{id}` - Delete habit
- `POST /habits/mark-complete` - Mark habit day complete/incomplete
- `GET /habits-dashboard` - Get habits dashboard with filters

#### Journal Endpoints:
- `GET /journals` - Get all journals
- `POST /journals` - Create journal entry
- `PUT /journals/{id}` - Update journal
- `DELETE /journals/{id}` - Delete journal

#### Quran Tracking Endpoints:
- `GET /quran` - Get Quran reading progress
- `POST /quran` - Update Quran reading

#### Salah (Prayer) Endpoints:
- `GET /salah/timings` - Get prayer times (with location params)

### **Data Format**
- **Request**: FormData and JSON
- **Response**: JSON with structure:
  ```json
  {
    "data": {
      "access_token": "...",
      "expires_in": 3600,
      "user": {...}
    }
  }
  ```

### **Expected Backend Technology**
- **Language**: PHP (7.4+ or 8.x)
- **Framework**: Laravel (likely 8.x, 9.x, or 10.x)
- **Authentication**: Laravel Sanctum or Passport (for token-based auth)

---

## 💾 DATABASE STACK (Based on API Analysis)

### **Most Likely Database**
**MySQL** or **PostgreSQL**

**Reasoning:**
- Laravel typically uses MySQL/PostgreSQL
- Relational data structure evident from API endpoints

### **Database Tables (Inferred from API)**

#### 1. **users**
- id
- name
- email
- password (hashed)
- email_verified_at
- device_token (for FCM)
- created_at
- updated_at

#### 2. **habits**
- id
- user_id (foreign key)
- name
- icon
- color
- frequency (day/40_days/custom)
- start_date
- end_date
- selected_days (JSON - for specific days of week)
- created_at
- updated_at

#### 3. **habit_completions**
- id
- habit_id (foreign key)
- completion_date
- is_completed (boolean)
- created_at
- updated_at

#### 4. **journals**
- id
- user_id (foreign key)
- title
- content (rich text)
- date
- created_at
- updated_at

#### 5. **quran_reads**
- id
- user_id (foreign key)
- surah_number
- from_ayah
- to_ayah
- date
- created_at
- updated_at

#### 6. **password_resets** (Laravel default)
- email
- token
- created_at

#### 7. **otp_verifications** (likely)
- email
- code
- expires_at
- created_at

#### 8. **duas** (likely)
- id
- title
- arabic_text
- transliteration
- translation
- category
- created_at
- updated_at

#### 9. **favorite_duas** (for user favorites)
- id
- user_id (foreign key)
- dua_id (foreign key)
- created_at

---

## 🌐 CURRENT ISSUE: API SERVER DOWN

### **Problem**
- **API URL**: `https://edeen.innovationpixel.com/public/api/`
- **Status**: Domain not resolving (DNS ENOTFOUND)
- **Impact**: All API calls fail with "Network Error"
- **Login**: Cannot authenticate users

### **Solution Options**

#### Option 1: Check Backend Server Hosting
- Verify domain registration and DNS settings
- Check if web hosting is active
- Ensure SSL certificate is valid
- Check server is running (Apache/Nginx + PHP-FPM)

#### Option 2: Deploy Laravel Backend
If you need to set up the backend:

**Requirements:**
- PHP 8.x
- Composer
- MySQL/PostgreSQL
- Laravel 9.x/10.x

**Basic Setup:**
```bash
# Install Laravel
composer create-project laravel/laravel edeen-backend

# Configure .env file
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=edeen
DB_USERNAME=root
DB_PASSWORD=

# Run migrations
php artisan migrate

# Start server (development)
php artisan serve
```

#### Option 3: Use Local API for Testing
Update `src/utils/api.js`:
```javascript
const api = axios.create({
  baseURL: "http://YOUR_LOCAL_IP:8000/api/", // e.g., http://192.168.1.100:8000/api/
  headers: {
    Accept: "application/json",
  },
});
```

---

## 📦 DEPLOYMENT STACK

### **Mobile App**
- **CI/CD**: Codemagic
- **iOS**: TestFlight → App Store
- **Android**: Google Play Internal Track → Production

### **Backend Hosting Options**
- **Shared Hosting**: cPanel with PHP/MySQL (like Bluehost, SiteGround)
- **VPS**: DigitalOcean, Linode, AWS EC2
- **Platform as a Service**: Laravel Forge, Heroku, AWS Elastic Beanstalk
- **Serverless**: AWS Lambda with Laravel Vapor

---

## 🔑 KEY CONFIGURATION FILES

### Frontend:
- `package.json` - Dependencies & scripts
- `android/app/build.gradle` - Android config
- `ios/edeen.xcodeproj/project.pbxproj` - iOS config
- `src/utils/api.js` - API configuration

### Backend (Laravel):
- `.env` - Environment variables
- `config/database.php` - Database config
- `routes/api.php` - API routes
- `config/cors.php` - CORS settings

---

## 🚀 NEXT STEPS TO FIX LOGIN

1. **Check Backend Server Status**
   - Contact hosting provider
   - Verify domain DNS records
   - Check server is running

2. **Test API Connectivity**
   ```bash
   curl https://edeen.innovationpixel.com/public/api/
   ```

3. **If Backend is Down - Deploy New Instance**
   - Set up Laravel backend
   - Configure database
   - Deploy to hosting
   - Update DNS if needed

4. **Test Login**
   - Verify API is reachable
   - Test with provided credentials: forcann66@gmail.com / Abcd@123

---

## 📞 ADDITIONAL INFORMATION NEEDED

To fully solve the login issue, I need:

1. **Backend Access**:
   - Do you have the Laravel backend code?
   - Do you have access to the hosting control panel?
   - What is the hosting provider?

2. **Database Access**:
   - Do you have database credentials?
   - Is the database on the same server or separate?

3. **Domain/DNS**:
   - Who manages the domain `innovationpixel.com`?
   - Can you access DNS settings?

---

**Created**: June 12, 2026
**Version**: 1.6.2
**Last Updated**: Current Session
