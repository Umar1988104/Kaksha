# Kaksha — Tuition/Coaching Center Manager

Manage students, attendance, fee dues and test scores. Sends fee reminders
via a pre-filled WhatsApp link (no paid WhatsApp Business API needed).

## Stack
React (Vite) + Firebase (Auth + Firestore) → wrapped with Capacitor → Android APK → Play Store.

---

## 1. Run it locally

```bash
npm install
cp .env.example .env   # then fill in your Firebase keys (step 2)
npm run dev
```

Opens at `http://localhost:5173`.

## 2. Set up Firebase (free tier is enough to start)

1. Go to https://console.firebase.google.com → **Add project**.
2. Inside the project: **Build > Authentication > Get started > Email/Password** → enable it.
   Then **Users tab > Add user** — create yourself as the admin login (this is the
   login you'll use in the app; there's no public sign-up screen by design).
3. **Build > Firestore Database > Create database** → start in **production mode**
   (rules below lock it to logged-in users only).
4. Go to **Project settings (gear icon) > General > Your apps > Web (</> icon)** →
   register an app → copy the `firebaseConfig` values into your `.env` file.
5. **Firestore rules** — go to Firestore > Rules and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This is fine for a single-admin app. If you later add multiple staff logins
with different permissions, tighten these rules.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Kaksha coaching center manager"
git branch -M main
git remote add origin https://github.com/<your-username>/kaksha.git
git push -u origin main
```

`.env` is git-ignored on purpose — never commit real Firebase keys to a public
repo. Anyone cloning the repo should copy `.env.example` and fill their own in.

## 4. Build the APK with Capacitor + Android Studio

Run these once, from the project root:

```bash
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
npx cap init "Kaksha" "com.yourname.kaksha" --web-dir=dist
npm run build
npx cap add android
npx cap copy android
npx cap open android
```

`npx cap open android` launches Android Studio with the project. From there:

1. Let Gradle sync finish.
2. **Build > Generate Signed Bundle / APK** → choose **APK** (or **Android App
   Bundle**, which Play Store prefers) → create a new keystore the first time
   (save it somewhere safe — you'll need the same one for every future update).
3. Pick **release** build variant → Finish. Your APK/AAB lands in
   `android/app/release/`.

Whenever you change the React code again: `npm run build && npx cap copy android`
before rebuilding in Android Studio.

## 5. Publish to Play Store

1. Create a one-time Google Play Console developer account (currently a $25
   one-time fee).
2. **Create app** → fill in title, description, screenshots, privacy policy
   URL (required — even a simple hosted page works), content rating
   questionnaire.
3. Upload the **.aab** file from step 4 under **Production > Create release**.
4. Submit for review. First review typically takes a few hours to a few days.

---

## Project structure

```
src/
  firebase.js          Firebase init (reads from .env)
  context/AuthContext.jsx
  components/          Navbar, ProtectedRoute, StudentForm, StatusStamp
  pages/                Login, Dashboard, Students, StudentDetail,
                        Attendance, Fees, TestScores
  utils/whatsapp.js     builds the wa.me pre-filled reminder link
  utils/dates.js        month/date helpers
```

## What's in v1 vs. what to add later

**Included:** student CRUD, daily attendance by batch, monthly fee due/paid
tracking with WhatsApp reminder links, test score entry and history,
dashboard summary.

**Natural next additions:** multiple staff logins with roles, automatic
month-end due generation (a scheduled Cloud Function), batch-level timetable,
CSV export of fee/attendance registers, push notifications instead of manual
WhatsApp taps (needs WhatsApp Business API, which costs money — the wa.me
approach here is free and works well for small centers).
