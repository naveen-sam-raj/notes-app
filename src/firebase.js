// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // ⭐ ADD THIS

const firebaseConfig = {
  apiKey: "AIzaSyB2y4g0CjMc9Cl6RM6jvvwfNKkm7sUuwYc",
  authDomain: "note-app-abff1.firebaseapp.com",
  projectId: "note-app-abff1",
  storageBucket: "note-app-abff1.firebasestorage.app",
  messagingSenderId: "368650857906",
  appId: "1:368650857906:web:b5390c854be87ebd1bc8ab",
  measurementId: "G-S8YPXRHWB1",
};

const app = initializeApp(firebaseConfig);

// ✅ Authentication
export const auth = getAuth(app);

// ✅ Firestore Database
export const db = getFirestore(app);
