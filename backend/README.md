# Edeen Backend API

REST API for the Edeen mobile app, rebuilt to match the original contract.

- **Stack:** Laravel 11 · PHP 8.2+ · MySQL · Laravel Sanctum (Bearer tokens)
- **Push:** Firebase Cloud Messaging (kreait/laravel-firebase)
- **Prayer times:** Aladhan API (server-side)
- **Base URL (app expects):** `http://edeenapp.co.uk/api/`

---

## 1. Requirements

- PHP **8.2+** with extensions: `pdo_mysql`, `mbstring`, `openssl`, `curl`, `json`, `bcmath`, `fileinfo`
- Composer 2
- MySQL 5.7+/8.0 (or MariaDB 10.3+)

## 2. Install

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Edit `.env` — set the database and (optionally) SMTP + Firebase:

```dotenv
APP_URL=http://edeenapp.co.uk
DB_DATABASE=edeen
DB_USERNAME=youruser
DB_PASSWORD=yourpass
```

Create the schema and a demo login:

```bash
php artisan migrate --seed
php artisan storage:link    # so uploaded avatars are publicly served
```

Demo account created by the seeder: **demo@edeenapp.co.uk / Password@123**

## 3. Run locally

```bash
php artisan serve
# API at http://127.0.0.1:8000/api/
```

## 4. Deploy to edeenapp.co.uk

**Point the web root at `backend/public`.** That makes the API available at
`http://edeenapp.co.uk/api/...` (matching the app).

- **cPanel / shared hosting:** upload the `backend` folder outside `public_html`,
  then either set the domain's Document Root to `.../backend/public`, or copy the
  contents of `public/` into `public_html` and edit the two `require` paths in
  `public_html/index.php` to point at your `backend` folder.
- **VPS (Nginx/Apache):** set `root .../backend/public;`.

After deploying:

```bash
php artisan migrate --force
php artisan config:cache && php artisan route:cache
chmod -R 775 storage bootstrap/cache
```

> If your host can only serve from the account root (so the URL becomes
> `http://edeenapp.co.uk/public/api/`), either fix the document root as above, or
> change the app's base URL in `src/utils/api.js` to include `/public`.
> **HTTPS is strongly recommended** (Apple/Play + FCM). Get a free Let's Encrypt
> cert and use `https://edeenapp.co.uk/api/`.

## 5. Email / OTP

Signup, verification and password reset send a 6-digit OTP by email. Configure
SMTP in `.env` (`MAIL_*`). Until SMTP is set, OTP codes are written to
`storage/logs/laravel.log` so you can still test the flow.

## 6. Firebase push notifications

The app's client config lives in the app (`google-services.json`,
`GoogleService-Info.plist`). For the **server** to send pushes you need a
**service-account** key (different file):

1. Firebase Console → Project **edeen-38edc** → Project settings → **Service accounts**
2. **Generate new private key** → download the JSON
3. Save it as `backend/storage/app/firebase/service-account.json`

Without it the API still runs; server push is simply disabled (the app also
schedules its own local notifications). `FIREBASE_*` vars are in `.env`.

## 7. Cron (optional)

For scheduled cleanup/notifications add one cron entry:

```
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## API reference

All responses are JSON: `{ "status": "success"|"error", "message": "...", "data": {...} }`.
Authenticated routes need header `Authorization: Bearer <access_token>`.

### Auth (public)
| Method | Path | Body |
|---|---|---|
| POST | `/api/signup` | name, email, password, password_confirmation |
| POST | `/api/login` | email, password → `data.access_token`, `data.user` |
| POST | `/api/verify` | email, code |
| GET  | `/api/get-otp` | (bearer or `?email=`) |
| POST | `/api/resend-otp` | email |
| POST | `/api/forgot-password` | email |
| POST | `/api/reset-password` | email, code, password, password_confirmation |

### Auth / profile (bearer)
| Method | Path | Body |
|---|---|---|
| POST | `/api/logout` | — |
| GET  | `/api/profile` | — |
| PUT  | `/api/profile` | name, email, phone, device_token, avatar? |
| POST | `/api/change-password` | current_password, new_password, new_password_confirmation |
| PUT  | `/api/device-token` | device_token |

### Habits (bearer)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/habits` | returns `data.habits[]` with `days_data` chunks |
| POST | `/api/habits` | name, icon, color, frequency(day/40_days/custom), start_date, custom_date?, days_of_week? |
| PUT | `/api/habits/{id}` | same body |
| DELETE | `/api/habits/{id}` | |
| GET | `/api/habits/progress` | `data.summary` |
| POST | `/api/habits/{id}/mark-completion` | completion_date |
| DELETE | `/api/habits/{id}/unmark-completion?completion_date=` | |

### Journals (bearer)
`GET/POST /api/journals`, `PUT/DELETE /api/journals/{id}` — title, description, emoji, tag, promt[], date.

### Quran (bearer)
`GET/POST /api/quran`, `PUT /api/quran/{id}` — date, read.

### Salah (bearer)
| Method | Path |
|---|---|
| GET | `/api/salah/timings?latitude=&longitude=&date=` |
| GET | `/api/salah/current-upcoming?latitude=&longitude=` |
| GET | `/api/salah/records?date=` |
| PUT | `/api/salah/records` (date + *_performed flags) |
