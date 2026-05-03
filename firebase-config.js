// firebase-config.js — Limitless CMS Firebase Connection
// Project: limitless-cms | Region: asia-south1 (Mumbai)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD1vnMRo_cCcqpzuV9prlrOiUIavz7nv6g",
  authDomain: "limitless-cms.firebaseapp.com",
  projectId: "limitless-cms",
  storageBucket: "limitless-cms.firebasestorage.app",
  messagingSenderId: "795014578598",
  appId: "1:795014578598:web:449def7c57453637480f67"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Read all CMS data (one-time) ──────────────────────────
export async function loadFromFirebase() {
    const snap = await getDoc(doc(db, 'cms', 'data'));
    return snap.exists() ? snap.data() : null;
}

// ── Write all CMS data ────────────────────────────────────
export async function saveToFirebase(state) {
    await setDoc(doc(db, 'cms', 'data'), {
        categories: state.categories,
        projects:   state.projects,
        updatedAt:  new Date().toISOString()
    });
}

// ── Real-time listener (for main site) ───────────────────
// callback(data) is called whenever CMS data changes in Firebase
export function listenToFirebase(callback) {
    return onSnapshot(doc(db, 'cms', 'data'), (snap) => {
        if (snap.exists()) callback(snap.data());
    });
}

export { db };
