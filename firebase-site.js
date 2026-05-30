// firebase-site.js v2 — Dynamic card renderer from Firebase CMS data
// Cards are generated fresh from Firebase every time a category opens

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyD1vnMRo_cCcqpzuV9prlrOiUIavz7nv6g',
    authDomain: 'limitless-cms.firebaseapp.com',
    projectId: 'limitless-cms',
    storageBucket: 'limitless-cms.firebasestorage.app',
    messagingSenderId: '795014578598',
    appId: '1:795014578598:web:449def7c57453637480f67'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Category short labels ──────────────────────────────────
const CAT_LABELS = {
    'HIGH QUALITY UGC ADS': 'UGC ADS',
    'ENTERTAINMENT & EVENTS': 'ENT & EVENTS',
    'FASHION & JEWELS': 'FASHION',
    'SPORTS & ACTIVEWEAR': 'SPORTS',
    'FOOD & BEVERAGE': 'FOOD & BEV',
    'REAL ESTATE & INTERIORS & ARCHITECTURE': 'REAL ESTATE',
    'HEALTHCARE & BEAUTY': 'HEALTH & BEAUTY',
    'EDUCATION & CONSULTANCY': 'EDUCATION',
    'LIFESTYLE & LUXURY': 'LIFESTYLE',
    CORPORATE: 'CORPORATE'
};

const DEFAULT_THUMB = 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=800&auto=format&fit=crop';
const DEFAULT_LOGO = 'https://res.cloudinary.com/dfstyia4c/image/upload/skaid-black_page-0001_wk4tyi.png';

// ── Auto-optimize image URLs ───────────────────────────────
// Adds quality/format transforms to Cloudinary & Unsplash URLs
function optimizeImageUrl(url) {
    if (!url) return url;
    // Cloudinary: add q_auto,f_auto,w_800 if no transforms present
    if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
        if (!url.includes('q_auto') && !url.includes('q_')) {
            return url.replace('/image/upload/', '/image/upload/q_auto,f_auto,w_800/');
        }
    }
    // Unsplash: ensure quality params
    if (url.includes('images.unsplash.com') && !url.includes('q=')) {
        const sep = url.includes('?') ? '&' : '?';
        return url + sep + 'q=80&w=800&auto=format&fit=crop';
    }
    return url;
}

// ── Build one project card HTML ────────────────────────────
function makeCard(p, index, catLabel) {
    const thumb = optimizeImageUrl(p.thumbnail || DEFAULT_THUMB);
    const logo = optimizeImageUrl(p.logo || DEFAULT_LOGO);
    const num = String(index).padStart(2, '0');
    const desc = (p.desc || '').replace(/"/g, '&quot;');
    const hasReel = p.reel && p.reel.startsWith('http');
    return `<article class="project-card glass" style="opacity: 1 !important; visibility: visible !important;"
                data-mood="${p.mood || 'pureWhite'}"
                data-cursor="VIEW"
                data-desc="${desc}"
                data-reel="${p.reel || ''}"
                data-reel1="${p.reel1 || ''}"
                data-reel2="${p.reel2 || ''}"
                data-reel3="${p.reel3 || ''}"
                data-instagram="${p.instagram || ''}">
        <div class="card-media">
            <img src="${thumb}" alt="${p.name}" loading="lazy" width="800" height="800">
            ${hasReel ? `
            <video src="${p.reel}" loop muted playsinline></video>
            <button class="card-sound-btn" aria-label="Toggle Sound">
                <!-- Muted icon (default) -->
                <svg class="sound-icon-muted" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.63 3.63L2.05 5.2l4.13 4.13L5 10v4h3l5 5v-4.88l4.12 4.12c-.56.38-1.18.69-1.87.89v2.02c1.23-.27 2.35-.86 3.29-1.68l2.21 2.21 1.41-1.41L3.63 3.63zM10 15.17L7.83 13H7v-2h.83l.88-.88L10 11.25v3.92zM19 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm1.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C21.93 14.86 22.5 13.5 22.5 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM14 3.23v2.06c2.89.86 5 3.54 5 6.71 0 .34-.02.68-.07 1.01l1.54 1.54c.33-.8.53-1.66.53-2.55 0-4.28-2.99-7.86-7-8.77z"/>
                </svg>
                <!-- Unmuted icon -->
                <svg class="sound-icon-unmuted hidden" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
            </button>
            ` : ''}
            <div class="card-brand-logo"><img src="${logo}" alt="${p.name}" loading="lazy" width="800" height="800"></div>
            <div class="card-overlay"></div>
            <div class="card-cursor-inner font-counter">VIEW</div>
        </div>
        <div class="card-info">
            <h3 class="card-name">${p.name}</h3>
            <div class="card-sub font-counter">
                <span class="card-id">${num}</span>
                <span class="dot">-+</span>${catLabel}
            </div>
        </div>
    </article>`;
}

// ── Called by main.js every time a category is opened ─────
// Replaces cat-grid contents with fresh CMS data
window.renderCategoryCards = function (categoryName) {
    const data = window.__CMS_DATA__ || window.__LOCAL_FALLBACK_DATA__;
    if (!data?.projects?.length) {
        console.log('[Firebase] No CMS or fallback data yet for:', categoryName);
        return;
    }

    // Find the matching cat-grid (handles & vs &amp; encoding)
    let targetGrid = null;
    document.querySelectorAll('.cat-grid').forEach((g) => {
        const decoded = (g.dataset.cat || '').replace(/&amp;/g, '&');
        if (decoded.toUpperCase() === categoryName.toUpperCase()) targetGrid = g;
    });
    if (!targetGrid) return;

    const catLabel = CAT_LABELS[categoryName] || categoryName;
    const projects = data.projects.filter(
        (p) => Array.isArray(p.categories) && p.categories.some((c) => c.toUpperCase() === categoryName.toUpperCase())
    );

    if (!projects.length) {
        console.log('[Firebase] No projects for category:', categoryName);
        return;
    }

    // Render cards into the grid
    targetGrid.innerHTML = projects.map((p, i) => makeCard(p, i + 1, catLabel)).join('');
    console.log(`[Firebase] Rendered ${projects.length} cards for "${categoryName}" from CMS`);
};

// ── Real-time listener ─────────────────────────────────────
onSnapshot(doc(db, 'cms', 'data'), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    if (!data.projects?.length) return;

    window.__CMS_DATA__ = data;
    console.log('[Firebase] CMS data ready:', data.projects.length, 'projects | v' + (data._version || '?'));

    // If a category is currently open, refresh it immediately
    const activeGrid = document.querySelector('.cat-grid.active');
    if (activeGrid) {
        const catName = (activeGrid.dataset.cat || '').replace(/&amp;/g, '&');
        window.renderCategoryCards(catName);
        // Re-wire click/hover handlers on the new cards
        if (typeof window.__wireCollageCards === 'function') window.__wireCollageCards();
    }
});

// ── Helpers ────────────────────────────────────────────────
window.getCMSProject = (name) =>
    window.__CMS_DATA__?.projects?.find((p) => p.name.toUpperCase() === name.toUpperCase()) || null;
window.getCMSCategories = () => window.__CMS_DATA__?.categories || [];
window.getCMSTalents = () => window.__CMS_DATA__?.talents || [];
