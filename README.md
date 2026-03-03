# 🔥 NoteFlow – Firebase Notes App

Full-stack Notes App with Firebase Auth + Firestore + Hosting.

---

## ✅ Features

- **Login / Signup** with Email & Password (Firebase Auth)
- **Home** showing user profile, stats (total notes, added today)
- **Full CRUD** — Create, Read, Update, Delete notes
- **Realtime sync** using Firestore `onSnapshot`
- **Search** notes by title or content
- Secure: each user only sees their own notes (Firestore rules)

---

## 🚀 Setup Guide

### 1. Create Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add Project** → give it a name → Continue

### 2. Enable Authentication

1. In your project → **Authentication** → Get Started
2. **Sign-in method** → Enable **Email/Password**

### 3. Enable Firestore

1. **Firestore Database** → Create database
2. Choose **production mode** (rules are in `firestore.rules`)
3. Pick a region close to you

### 4. Get Your Config

1. **Project Settings** (gear icon) → **Your apps** → Add Web App
2. Copy the `firebaseConfig` object

### 5. Paste Config into index.html

Open `index.html` and replace this block (~line 240):

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

---

## 🌐 Deploy to Firebase Hosting

### Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Initialize (run once in project folder)

```bash
firebase init
```

Select:

- ✅ Firestore
- ✅ Hosting

When asked about public directory → type `.` (current folder)  
Single-page app? → Yes

### Deploy!

```bash
firebase deploy
```

Your app will be live at:
`https://YOUR_PROJECT_ID.web.app`

---

## 📁 File Structure

```
notes-app/
├── index.html          ← Full app (HTML + CSS + JS)
├── firebase.json       ← Hosting config
├── firestore.rules     ← Security rules (users only see own notes)
└── firestore.indexes.json  ← Composite index for queries
```

---

## 🔒 Firestore Security Rules

Each user can only read/write notes where `uid == their UID`.
Deploy rules automatically with `firebase deploy`.
