// firebase-admin.js — Wires Firebase into the CMS admin panel
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const CMS_REF = doc(db, 'cms', 'data');

// ── Load from Firebase on boot (overrides localStorage if cloud data exists) ──
async function initFromFirebase() {
    try {
        const snap = await getDoc(CMS_REF);
        if (snap.exists()) {
            const data = snap.data();
            // Only overwrite local if cloud data is newer
            const localRaw = localStorage.getItem('lp_cms_data');
            const local = localRaw ? JSON.parse(localRaw) : null;
            const cloudTime = data.updatedAt || '0';
            const localTime = local?.updatedAt || '0';
            if (cloudTime >= localTime && data.projects?.length > 0) {
                window.state = { categories: data.categories || [], projects: data.projects || [] };
                // Sync into localStorage for offline use
                const existing = JSON.parse(localStorage.getItem('lp_cms_data') || '{}');
                localStorage.setItem('lp_cms_data', JSON.stringify({
                    ...existing,
                    categories: data.categories,
                    projects: data.projects,
                    updatedAt: data.updatedAt
                }));
                // Re-render with cloud data
                if (typeof render === 'function') render();
                console.log('[Firebase] Loaded from cloud:', data.projects.length, 'projects');
            }
        } else {
            // First time — push local data to Firebase
            const localRaw = localStorage.getItem('lp_cms_data');
            if (localRaw) {
                const local = JSON.parse(localRaw);
                if (local.projects?.length > 0) {
                    await saveToFirebase({ categories: local.categories, projects: local.projects });
                    console.log('[Firebase] First sync — pushed local data to cloud');
                }
            }
        }
    } catch (err) {
        console.warn('[Firebase] Could not load from cloud:', err.message);
    }
}

// ── Save to Firebase ──────────────────────────────────────
async function saveToFirebase(state) {
    const payload = {
        categories: state.categories || [],
        projects:   state.projects   || [],
        updatedAt:  new Date().toISOString()
    };
    await setDoc(CMS_REF, payload);
    // Update updatedAt in localStorage too
    const existing = JSON.parse(localStorage.getItem('lp_cms_data') || '{}');
    localStorage.setItem('lp_cms_data', JSON.stringify({ ...existing, updatedAt: payload.updatedAt }));
}

// ── Wire into admin.js ────────────────────────────────────
window._fbSave = saveToFirebase;

// ── Init ─────────────────────────────────────────────────
initFromFirebase();
