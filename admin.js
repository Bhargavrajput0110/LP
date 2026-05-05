// ============================================================
// LIMITLESS CMS — admin.js
// ============================================================

// ── Default data — uses SEED_PROJECTS from admin-seed.js ──
const DEFAULT_DATA = {
    categories: [
        { id: "HIGH QUALITY UGC ADS", label: "UGC ADS" },
        { id: "ENTERTAINMENT & EVENTS", label: "ENT & EVENTS" },
        { id: "FASHION & JEWELS", label: "FASHION" },
        { id: "SPORTS & ACTIVEWEAR", label: "SPORTS" },
        { id: "FOOD & BEVERAGE", label: "FOOD & BEV" },
        { id: "REAL ESTATE & INTERIORS & ARCHITECTURE", label: "REAL ESTATE" },
        { id: "HEALTHCARE & BEAUTY", label: "HEALTH & BEAUTY" },
        { id: "EDUCATION & CONSULTANCY", label: "EDUCATION" },
        { id: "LIFESTYLE & LUXURY", label: "LIFESTYLE" },
        { id: "CORPORATE", label: "CORPORATE" }
    ],
    projects: typeof SEED_PROJECTS !== 'undefined' ? SEED_PROJECTS : []
};

// ── State ──────────────────────────────────────────────────
let state = { categories: [], projects: [] };
let currentTab = 'overview';
let editingProjectId = null;
let confirmCallback = null;

// ── Firebase (loaded as module in admin.html) ─────────────
let _fbSave = null; // set by firebase-admin.js after import

// ── Bootstrap ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    render();
    lucide.createIcons();
});

function loadState() {
    try {
        const saved = localStorage.getItem('lp_cms_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Strip internal _version key from state
            state = { categories: parsed.categories || [], projects: parsed.projects || [] };
        } else {
            state = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
    } catch (e) {
        state = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
}

function saveToLocalStorage() {
    const existing = JSON.parse(localStorage.getItem('lp_cms_data') || '{}');
    localStorage.setItem('lp_cms_data', JSON.stringify({
        _version: existing._version || 4,
        categories: state.categories,
        projects: state.projects
    }));
    // Push to Firebase via window._fbSave (set by firebase-admin.js module)
    const fbSave = window._fbSave;
    if (typeof fbSave === 'function') {
        fbSave(state)
            .then(() => showToast('Saved & synced to cloud ☁️'))
            .catch(err => { console.error('[CMS] Firebase save failed:', err); showToast('Saved locally (cloud sync failed)'); });
    } else {
        showToast('All changes saved!');
    }
}

// ── Tab Routing ────────────────────────────────────────────
function switchTab(tab) {
    currentTab = tab;
    ['overview','projects','categories'].forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) el.classList.toggle('active', t === tab);
    });
    render();
}

function render() {
    const titles = { overview: 'Overview', projects: 'Projects', categories: 'Categories' };
    document.getElementById('page-title').textContent = titles[currentTab] || '';

    const sub = document.getElementById('page-subtitle');
    const hdr = document.getElementById('header-actions');
    sub.classList.add('hidden');
    hdr.innerHTML = '';

    if (currentTab === 'overview')   renderOverview();
    if (currentTab === 'projects')   renderProjects();
    if (currentTab === 'categories') renderCategories();

    lucide.createIcons();
}

// ── OVERVIEW ───────────────────────────────────────────────
function renderOverview() {
    const totalProjects = state.projects.length;
    const totalCats = state.categories.length;
    const withLandscape = state.projects.filter(p => p.reel).length;
    const withPortrait  = state.projects.filter(p => p.reel1 || p.reel2 || p.reel3).length;

    document.getElementById('content-area').innerHTML = `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            ${statCard('Total Projects', totalProjects, 'film')}
            ${statCard('Categories', totalCats, 'tag')}
            ${statCard('With Landscape Video', withLandscape, 'monitor-play')}
            ${statCard('With Portrait Reels', withPortrait, 'smartphone')}
        </div>

        <div class="card p-6 mb-6">
            <p class="text-sm font-semibold mb-1">👋 Welcome to Limitless CMS</p>
            <p class="text-sm text-muted">Use the <b>Projects</b> tab to add, edit or remove project cards. Use <b>Categories</b> to manage your category tiles. When done, click <b>Save All Changes</b> then <b>Export JSON</b> to apply them to your live site.</p>
        </div>

        <div class="card p-6">
            <p class="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Quick Guide</p>
            <div class="space-y-3 text-sm text-muted">
                ${tip('plus-circle','Click "Add New Project" in the Projects tab to create a card.')}
                ${tip('film','Each project can have 1 landscape video + up to 3 portrait reels. Paste the cloud (Cloudinary/CDN) URL.')}
                ${tip('tag','Assign each project to one or more categories so it appears in the right section.')}
                ${tip('download','Export JSON when ready — share the file with your developer to push live.')}
            </div>
        </div>
    `;
    lucide.createIcons();
}

function statCard(label, val, icon) {
    return `<div class="stat-card">
        <div class="flex items-center justify-between mb-2">
            <p class="stat-label">${label}</p>
            <i data-lucide="${icon}" class="w-4 h-4 text-muted opacity-50"></i>
        </div>
        <p class="stat-value">${val}</p>
    </div>`;
}

function tip(icon, text) {
    return `<div class="flex items-start gap-3">
        <i data-lucide="${icon}" class="w-4 h-4 text-accent mt-0.5 flex-shrink-0"></i>
        <span>${text}</span>
    </div>`;
}

// ── PROJECTS ───────────────────────────────────────────────
function renderProjects() {
    const hdr = document.getElementById('header-actions');
    hdr.innerHTML = `
        <input oninput="filterProjects(this.value)" placeholder="Search projects…" class="form-input w-52 text-sm py-2 px-3" style="background:#f5f6f8;">
        <button onclick="openProjectModal(null)" class="btn btn-primary ml-2">
            <i data-lucide="plus" class="w-4 h-4"></i> Add New Project
        </button>`;

    renderProjectList('');
    lucide.createIcons();
}

function renderProjectList(query) {
    const area = document.getElementById('content-area');
    const filtered = state.projects.filter(p =>
        !query || p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.categories || []).some(c => c.toLowerCase().includes(query.toLowerCase()))
    );

    if (!filtered.length) {
        area.innerHTML = `<div class="empty-state">
            <i data-lucide="film" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
            <p class="font-medium text-gray-400 mb-2">${query ? 'No results found' : 'No projects yet'}</p>
            <p class="text-sm text-gray-300 mb-6">Add your first project card using the button above.</p>
        </div>`;
        lucide.createIcons();
        return;
    }

    area.innerHTML = `<div class="space-y-3" id="project-list">
        ${filtered.map(p => projectRow(p)).join('')}
    </div>`;
    lucide.createIcons();
}

function filterProjects(q) {
    renderProjectList(q);
    lucide.createIcons();
}

function projectRow(p) {
    const cats = (p.categories || []).map(c =>
        `<span class="badge badge-blue">${c}</span>`
    ).join('');

    const hasLand = p.reel ? `<span class="orient-badge orient-landscape"><i data-lucide="monitor" class="w-2.5 h-2.5"></i> Landscape</span>` : '';
    const portCount = [p.reel1, p.reel2, p.reel3].filter(Boolean).length;
    const hasPort = portCount ? `<span class="orient-badge orient-portrait"><i data-lucide="smartphone" class="w-2.5 h-2.5"></i> ${portCount} Portrait</span>` : '';

    const thumb = p.thumbnail
        ? `<img src="${p.thumbnail}" class="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0" onerror="this.style.display='none'">`
        : `<div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><i data-lucide="image" class="w-4 h-4 text-gray-300"></i></div>`;

    return `<div class="card p-4 flex items-center gap-4 group">
        ${thumb}
        <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm truncate">${p.name}</p>
            <p class="text-xs text-muted truncate mt-0.5">${p.desc || 'No description'}</p>
            <div class="flex flex-wrap items-center gap-1.5 mt-2">
                ${hasLand}${hasPort}${cats}
            </div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="moveProjectUp('${p.id}')" class="btn-icon" title="Move Up">
                <i data-lucide="arrow-up" class="w-4 h-4"></i>
            </button>
            <button onclick="moveProjectDown('${p.id}')" class="btn-icon" title="Move Down">
                <i data-lucide="arrow-down" class="w-4 h-4"></i>
            </button>
            <div class="w-px h-4 bg-gray-200 mx-1"></div>
            <button onclick="duplicateProject('${p.id}')" class="btn-icon" title="Duplicate">
                <i data-lucide="copy" class="w-4 h-4"></i>
            </button>
            <button onclick="openProjectModal('${p.id}')" class="btn-icon" title="Edit">
                <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteProject('${p.id}')" class="btn-icon text-red-400 hover:bg-red-50 hover:text-red-500" title="Delete">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    </div>`;
}

// ── PROJECT MODAL ──────────────────────────────────────────
function openProjectModal(id) {
    editingProjectId = id;
    const p = id ? state.projects.find(x => x.id === id) : null;

    document.getElementById('modal-title').textContent = p ? `Edit — ${p.name}` : 'Add New Project';
    document.getElementById('modal-content').innerHTML = projectForm(p);
    document.getElementById('modal-backdrop').classList.add('open');

    // Init category tags
    if (p) (p.categories || []).forEach(addCategoryTag);

    lucide.createIcons();
}

function projectForm(p) {
    const catOptions = state.categories.map(c =>
        `<option value="${c.id}">${c.id}</option>`
    ).join('');

    return `<div class="p-6 space-y-5">

        <!-- Name -->
        <div>
            <label class="form-label">Project / Client Name *</label>
            <input id="f-name" class="form-input" placeholder="e.g. BOLLYVERSE" value="${p?.name || ''}">
        </div>

        <!-- Description -->
        <div>
            <label class="form-label">Short Description</label>
            <input id="f-desc" class="form-input" placeholder="e.g. Premier Bollyverse event recap." value="${p?.desc || ''}">
        </div>

        <!-- Thumbnail -->
        <div>
            <label class="form-label">Thumbnail Image URL</label>
            <div class="video-input-group">
                <input id="f-thumbnail" class="form-input" placeholder="https://res.cloudinary.com/…/image.jpg" value="${p?.thumbnail || ''}">
                <button class="preview-btn" onclick="previewImage('f-thumbnail')">
                    <i data-lucide="image" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        </div>

        <!-- Landscape Video -->
        <div class="bg-green-50/60 rounded-xl p-4 border border-green-100">
            <div class="flex items-center gap-2 mb-3">
                <i data-lucide="monitor-play" class="w-4 h-4 text-green-600"></i>
                <label class="form-label mb-0 text-green-700">Landscape Video (16:9) — Main Reel</label>
            </div>
            <div class="video-input-group">
                <input id="f-reel" class="form-input" placeholder="Cloudinary or CDN video URL" value="${p?.reel || ''}">
                <button class="preview-btn" onclick="previewVideo('f-reel','Main Landscape Reel')">
                    <i data-lucide="play" class="w-3.5 h-3.5"></i> Preview
                </button>
            </div>
            <p class="text-xs text-green-600/70 mt-1.5">This is the primary video shown in the cinematic project reveal.</p>
        </div>

        <!-- Portrait Reels -->
        <div class="bg-purple-50/60 rounded-xl p-4 border border-purple-100">
            <div class="flex items-center gap-2 mb-3">
                <i data-lucide="smartphone" class="w-4 h-4 text-purple-600"></i>
                <label class="form-label mb-0 text-purple-700">Portrait Reels (9:16) — Up to 3</label>
            </div>
            <div class="space-y-3">
                ${portraitInput(1, p?.reel1)}
                ${portraitInput(2, p?.reel2)}
                ${portraitInput(3, p?.reel3)}
            </div>
            <p class="text-xs text-purple-600/70 mt-2">These play on hover in the Deep Dive section. Must be vertical videos.</p>
        </div>

        <!-- Categories -->
        <div>
            <label class="form-label">Categories (assign to one or more)</label>
            <select onchange="addCategoryFromSelect(this)" class="form-input mb-2">
                <option value="">— Pick a category to assign —</option>
                ${catOptions}
            </select>
            <div class="tag-wrap" id="cat-tag-wrap" onclick="this.querySelector('input').focus()">
                <input class="tag-input-inline" id="cat-tag-input" placeholder="Type & Enter to add custom…" onkeydown="tagKeyDown(event)">
            </div>
            <input type="hidden" id="f-categories" value="${JSON.stringify(p?.categories || []).replace(/"/g, '&quot;')}">
        </div>

        <!-- Mood -->
        <div>
            <label class="form-label">Card Mood / Color Theme</label>
            <select id="f-mood" class="form-input">
                <option value="pureWhite" ${p?.mood==='pureWhite'?'selected':''}>Pure White (Default)</option>
                <option value="goldenWarmth" ${p?.mood==='goldenWarmth'?'selected':''}>Golden Warmth</option>
                <option value="darkEditorial" ${p?.mood==='darkEditorial'?'selected':''}>Dark Editorial</option>
            </select>
        </div>

        <!-- Brand Logo -->
        <div>
            <label class="form-label">Brand Logo URL (optional)</label>
            <input id="f-logo" class="form-input" placeholder="https://res.cloudinary.com/…/logo.png" value="${p?.logo || ''}">
        </div>

        <!-- Instagram -->
        <div>
            <label class="form-label">Instagram Handle (optional)</label>
            <input id="f-instagram" class="form-input" placeholder="@clienthandle" value="${p?.instagram || ''}">
        </div>
    </div>`;
}

function portraitInput(n, val) {
    return `<div class="video-input-group">
        <span class="text-xs text-purple-500 font-semibold w-4 flex-shrink-0">${n}</span>
        <input id="f-reel${n}" class="form-input" placeholder="Portrait reel ${n} URL (9:16)" value="${val || ''}">
        <button class="preview-btn" onclick="previewVideo('f-reel${n}','Portrait Reel ${n}')">
            <i data-lucide="play" class="w-3.5 h-3.5"></i>
        </button>
    </div>`;
}

function saveProject() {
    const name = document.getElementById('f-name').value.trim().toUpperCase();
    if (!name) { alert('Please enter a project name.'); return; }

    const cats = JSON.parse(document.getElementById('f-categories').value || '[]');
    const project = {
        id: editingProjectId || 'proj_' + Date.now(),
        name,
        desc:       document.getElementById('f-desc').value.trim(),
        thumbnail:  document.getElementById('f-thumbnail').value.trim(),
        reel:       document.getElementById('f-reel').value.trim(),
        reel1:      document.getElementById('f-reel1').value.trim(),
        reel2:      document.getElementById('f-reel2').value.trim(),
        reel3:      document.getElementById('f-reel3').value.trim(),
        mood:       document.getElementById('f-mood').value,
        logo:       document.getElementById('f-logo').value.trim(),
        instagram:  document.getElementById('f-instagram').value.trim(),
        categories: cats
    };

    if (editingProjectId) {
        const i = state.projects.findIndex(p => p.id === editingProjectId);
        if (i > -1) state.projects[i] = project;
    } else {
        state.projects.push(project);
    }

    saveToLocalStorage();
    closeModal();
    renderProjects();
}

function deleteProject(id) {
    showConfirm('Delete this project? This cannot be undone.', () => {
        state.projects = state.projects.filter(p => p.id !== id);
        saveToLocalStorage();
        renderProjectList('');
        lucide.createIcons();
    });
}

function duplicateProject(id) {
    const p = state.projects.find(x => x.id === id);
    if (!p) return;
    
    const clone = JSON.parse(JSON.stringify(p));
    clone.id = 'proj_' + Date.now();
    clone.name = clone.name + ' (COPY)';
    
    const idx = state.projects.findIndex(x => x.id === id);
    state.projects.splice(idx + 1, 0, clone);
    
    saveToLocalStorage();
    renderProjectList('');
    showToast('Project duplicated!');
}

function moveProjectUp(id) {
    const idx = state.projects.findIndex(x => x.id === id);
    if (idx <= 0) return;
    
    const temp = state.projects[idx - 1];
    state.projects[idx - 1] = state.projects[idx];
    state.projects[idx] = temp;
    
    saveToLocalStorage();
    renderProjectList('');
}

function moveProjectDown(id) {
    const idx = state.projects.findIndex(x => x.id === id);
    if (idx === -1 || idx >= state.projects.length - 1) return;
    
    const temp = state.projects[idx + 1];
    state.projects[idx + 1] = state.projects[idx];
    state.projects[idx] = temp;
    
    saveToLocalStorage();
    renderProjectList('');
}

function closeModal() {
    document.getElementById('modal-backdrop').classList.remove('open');
    editingProjectId = null;
}

// ── Category Tag Helpers ───────────────────────────────────
function addCategoryFromSelect(sel) {
    if (!sel.value) return;
    addCategoryTag(sel.value);
    sel.value = '';
}

function addCategoryTag(val) {
    val = val.trim();
    if (!val) return;
    const cats = JSON.parse(document.getElementById('f-categories').value || '[]');
    if (cats.includes(val)) return;
    cats.push(val);
    document.getElementById('f-categories').value = JSON.stringify(cats);

    const wrap = document.getElementById('cat-tag-wrap');
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${val} <button type="button" onclick="removeCatTag(this,'${val}')"><i data-lucide="x" class="w-3 h-3"></i></button>`;
    wrap.insertBefore(chip, document.getElementById('cat-tag-input'));
    lucide.createIcons();
}

function removeCatTag(btn, val) {
    btn.parentElement.remove();
    const cats = JSON.parse(document.getElementById('f-categories').value || '[]');
    document.getElementById('f-categories').value = JSON.stringify(cats.filter(c => c !== val));
}

function tagKeyDown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addCategoryTag(e.target.value);
        e.target.value = '';
    }
}

// ── CATEGORIES ─────────────────────────────────────────────
function renderCategories() {
    const hdr = document.getElementById('header-actions');
    hdr.innerHTML = `<button onclick="addCategory()" class="btn btn-primary">
        <i data-lucide="plus" class="w-4 h-4"></i> Add Category
    </button>`;

    const area = document.getElementById('content-area');
    area.innerHTML = `
        <p class="text-sm text-muted mb-5">These are the category tiles shown on your landing page. Reorder or rename them below.</p>
        <div class="space-y-2" id="cat-list">
            ${state.categories.map((c, i) => categoryRow(c, i)).join('')}
        </div>`;
    lucide.createIcons();
}

function categoryRow(c, i) {
    const count = state.projects.filter(p => (p.categories || []).includes(c.id)).length;
    return `<div class="cat-row" id="cat-${i}">
        <div class="flex items-center gap-3 flex-1 min-w-0">
            <i data-lucide="grip-vertical" class="w-4 h-4 drag-handle"></i>
            <div class="flex-1 min-w-0">
                <input class="form-input text-sm font-medium py-1.5" value="${c.id}"
                    onchange="updateCatId(${i},this.value)"
                    style="background:transparent;border-color:transparent;"
                    onfocus="this.style.borderColor='#2563eb';this.style.background='#fff'"
                    onblur="this.style.borderColor='transparent';this.style.background='transparent'">
                <p class="text-xs text-muted ml-1">${count} project${count !== 1 ? 's' : ''} assigned</p>
            </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
            <input class="form-input text-xs py-1.5 w-28" value="${c.label}" placeholder="Short label"
                onchange="updateCatLabel(${i},this.value)"
                style="background:#f9fafb;">
            <button onclick="deleteCategory(${i})" class="btn-icon text-red-400 hover:bg-red-50">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    </div>`;
}

function addCategory() {
    const name = prompt('New category name:');
    if (!name) return;
    state.categories.push({ id: name.trim().toUpperCase(), label: name.trim().toUpperCase() });
    saveToLocalStorage();
    renderCategories();
}

function updateCatId(i, val) {
    const old = state.categories[i].id;
    state.categories[i].id = val.trim().toUpperCase();
    // Update references in projects
    state.projects.forEach(p => {
        if (!p.categories) return;
        const idx = p.categories.indexOf(old);
        if (idx > -1) p.categories[idx] = state.categories[i].id;
    });
    saveToLocalStorage();
}

function updateCatLabel(i, val) {
    state.categories[i].label = val.trim();
    saveToLocalStorage();
}

function deleteCategory(i) {
    const cat = state.categories[i];
    showConfirm(`Delete category "${cat.id}"? Projects in this category won't be deleted.`, () => {
        state.categories.splice(i, 1);
        saveToLocalStorage();
        renderCategories();
    });
}

// ── VIDEO / IMAGE PREVIEW ──────────────────────────────────
function previewVideo(inputId, label) {
    const src = document.getElementById(inputId)?.value?.trim();
    if (!src) { alert('Please paste a video URL first.'); return; }
    document.getElementById('preview-video').src = src;
    document.getElementById('preview-label').textContent = label;
    document.getElementById('video-preview-modal').classList.add('open');
}

function closeVideoPreview() {
    document.getElementById('video-preview-modal').classList.remove('open');
    document.getElementById('preview-video').pause();
    document.getElementById('preview-video').src = '';
}

function previewImage(inputId) {
    const src = document.getElementById(inputId)?.value?.trim();
    if (!src) { alert('Please paste an image URL first.'); return; }
    window.open(src, '_blank');
}

// ── EXPORT ─────────────────────────────────────────────────
function exportData() {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'limitless-content.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported limitless-content.json!');
}

// ── TOAST ──────────────────────────────────────────────────
function showToast(msg) {
    const el = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    el.style.transform = 'translateY(0)';
    el.style.opacity = '1';
    setTimeout(() => {
        el.style.transform = 'translateY(80px)';
        el.style.opacity = '0';
    }, 2500);
}

// ── CONFIRM DIALOG ─────────────────────────────────────────
function showConfirm(msg, cb) {
    document.getElementById('confirm-msg').textContent = msg;
    document.getElementById('confirm-dialog').style.display = 'flex';
    confirmCallback = cb;
}
function proceedConfirm() {
    document.getElementById('confirm-dialog').style.display = 'none';
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
}
function cancelConfirm() {
    document.getElementById('confirm-dialog').style.display = 'none';
    confirmCallback = null;
}
