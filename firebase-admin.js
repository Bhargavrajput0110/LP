// firebase-admin.js v2 — Auto-syncs seed version bumps to Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD1vnMRo_cCcqpzuV9prlrOiUIavz7nv6g",
    authDomain: "limitless-cms.firebaseapp.com",
    projectId: "limitless-cms",
    storageBucket: "limitless-cms.firebasestorage.app",
    messagingSenderId: "795014578598",
    appId: "1:795014578598:web:449def7c57453637480f67"
};

const app    = initializeApp(firebaseConfig);
const db     = getFirestore(app);
const CMS_REF = doc(db, 'cms', 'data');

// ── Save to Firebase ───────────────────────────────────────
async function saveToFirebase(state) {
    const localVersion = JSON.parse(localStorage.getItem('lp_cms_data') || '{}')._version || 4;
    const payload = {
        categories: state.categories || [],
        projects:   state.projects   || [],
        talents:    state.talents    || [],
        updatedAt:  new Date().toISOString(),
        _version:   state._version || localVersion
    };
    await setDoc(CMS_REF, payload);
    // Stamp updatedAt in localStorage too
    const existing = JSON.parse(localStorage.getItem('lp_cms_data') || '{}');
    localStorage.setItem('lp_cms_data', JSON.stringify({ ...existing, updatedAt: payload.updatedAt }));
    console.log('[Firebase Admin] Saved v' + payload._version + ' to Firebase');
}

// ── Init: sync seed version with Firebase ─────────────────
async function initFromFirebase() {
    try {
        const snap         = await getDoc(CMS_REF);
        const localRaw     = localStorage.getItem('lp_cms_data');
        const local        = localRaw ? JSON.parse(localRaw) : null;
        const localVersion = local?._version || 0;

        if (snap.exists()) {
            const fbData      = snap.data();
            const fbVersion   = fbData._version || 0;

            if (localVersion > fbVersion) {
                // ── Local seed is NEWER → auto-push to Firebase ──
                console.log(`[Firebase Admin] Local v${localVersion} > Firebase v${fbVersion} → auto-pushing`);
                await saveToFirebase({
                    categories: local.categories,
                    projects:   local.projects,
                    talents:    local.talents,
                    _version:   localVersion
                });
                window.state = { categories: local.categories, projects: local.projects, talents: local.talents };
            } else {
                // ── Firebase is current or newer → load from Firebase ──
                console.log(`[Firebase Admin] Using Firebase v${fbVersion}`);
                window.state = { 
                    categories: fbData.categories || [], 
                    projects: fbData.projects || [], 
                    talents: fbData.talents || [] 
                };
                // Sync into localStorage for offline use
                localStorage.setItem('lp_cms_data', JSON.stringify({
                    ...local,
                    _version:   fbVersion,
                    categories: fbData.categories || [],
                    projects:   fbData.projects || [],
                    talents:    fbData.talents || [],
                    updatedAt:  fbData.updatedAt
                }));
            }
        } else {
            // ── First time: no Firebase data → push local ──
            if (local?.projects?.length > 0) {
                console.log('[Firebase Admin] First sync → pushing local data to Firebase');
                await saveToFirebase({
                    categories: local.categories,
                    projects:   local.projects,
                    talents:    local.talents,
                    _version:   localVersion
                });
            }
            window.state = { 
                categories: local?.categories || [], 
                projects: local?.projects || [],
                talents: local?.talents || []
            };
        }

        // Re-render CMS UI with (possibly updated) state
        if (typeof render === 'function') render();

    } catch (err) {
        console.warn('[Firebase Admin] Init failed:', err.message);
        // Fallback: use localStorage data
        const local = JSON.parse(localStorage.getItem('lp_cms_data') || '{}');
        if (local.projects) {
            window.state = { 
                categories: local.categories || [], 
                projects: local.projects || [],
                talents: local.talents || []
            };
            if (typeof render === 'function') render();
        }
    }
}

// ── Wire _fbSave for admin.js to call on "Save All Changes" ─
window._fbSave = saveToFirebase;

// ── Go ────────────────────────────────────────────────────
initFromFirebase();
