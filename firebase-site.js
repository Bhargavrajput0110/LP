// firebase-site.js — Real-time listener for the main portfolio site
// Include this as <script type="module"> in index.html
// When CMS saves → Firebase updates → this fires → site re-renders

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// ── Real-time listener ────────────────────────────────────
onSnapshot(doc(db, 'cms', 'data'), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    if (!data.projects?.length) return;

    // Cache in window for main.js to use
    window.__CMS_DATA__ = data;

    // Dispatch event so main.js can react
    window.dispatchEvent(new CustomEvent('cms:updated', { detail: data }));
    console.log('[Firebase] Real-time update received:', data.projects.length, 'projects');
});

// ── Helper: get project data by card name ─────────────────
// Used by main.js to populate project reveal with live data
window.getCMSProject = function(name) {
    const data = window.__CMS_DATA__;
    if (!data?.projects) return null;
    return data.projects.find(p =>
        p.name.toUpperCase() === name.toUpperCase()
    ) || null;
};

// ── Helper: get category list ─────────────────────────────
window.getCMSCategories = function() {
    return window.__CMS_DATA__?.categories || [];
};
