// firebase-site.js — Real-time CMS data → DOM patch
// Listens to Firebase and updates data-reel attributes on project cards

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

// ── Patch video attributes on every matching project card ─
function patchCards(projects) {
    if (!projects?.length) return;

    // Build a fast lookup map: UPPERCASE NAME → project
    const map = {};
    projects.forEach(p => { map[p.name.toUpperCase().trim()] = p; });

    // Find all project cards — works whether collage.html is already
    // in the DOM or gets injected later via main.js fetch
    const cards = document.querySelectorAll('article.project-card');
    let patched = 0;

    cards.forEach(card => {
        const nameEl = card.querySelector('.card-name');
        if (!nameEl) return;
        const name = nameEl.textContent.trim().toUpperCase();
        const proj = map[name];
        if (!proj) return;

        // Overwrite data attributes with CMS values
        if (proj.reel  !== undefined) card.dataset.reel  = proj.reel  || '';
        if (proj.reel1 !== undefined) card.dataset.reel1 = proj.reel1 || '';
        if (proj.reel2 !== undefined) card.dataset.reel2 = proj.reel2 || '';
        if (proj.reel3 !== undefined) card.dataset.reel3 = proj.reel3 || '';
        if (proj.mood  !== undefined) card.dataset.mood  = proj.mood  || 'pureWhite';
        patched++;
    });

    if (patched > 0) console.log(`[Firebase] Patched ${patched} cards with CMS video data`);

    // Dispatch event so any other scripts can react
    window.dispatchEvent(new CustomEvent('cms:updated', { detail: { projects, map } }));
}

// ── Also patch when collage.html is injected into the DOM ─
// main.js dispatches 'collage:ready' after injecting collage.html
window.addEventListener('collage:ready', () => {
    if (window.__CMS_DATA__) patchCards(window.__CMS_DATA__.projects);
});

// ── Real-time listener ─────────────────────────────────────
onSnapshot(doc(db, 'cms', 'data'), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    if (!data.projects?.length) return;

    window.__CMS_DATA__ = data;
    patchCards(data.projects);
    console.log('[Firebase] Real-time update:', data.projects.length, 'projects, updatedAt:', data.updatedAt);
});

// ── Helpers for main.js ───────────────────────────────────
window.getCMSProject    = (name) => window.__CMS_DATA__?.projects?.find(p => p.name.toUpperCase() === name.toUpperCase()) || null;
window.getCMSCategories = ()     => window.__CMS_DATA__?.categories || [];
