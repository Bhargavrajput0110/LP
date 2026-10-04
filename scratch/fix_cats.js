const path = require('path');
const fs = require('fs');
const file = path.resolve('d:/backup-l[/LP/admin.js');
let js = fs.readFileSync(file, 'utf8');

// Normalize to LF for easier matching
js = js.replace(/\r\n/g, '\n');

// ─────────────────────────────────────────────────────────────────
// 1. Replace the category badge in projectRow to add inline ×
// ─────────────────────────────────────────────────────────────────
const oldCatBadge = "const cats = (p.categories || []).map(c =>\n        `<span class=\"badge badge-blue\">${c}</span>`\n    ).join('');";
const newCatBadge = `const cats = (p.categories || []).map(c =>
        \`<span class="badge badge-blue" style="display:inline-flex;align-items:center;gap:4px;padding-right:4px;">
            \${c}
            <button type="button" style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:rgba(0,0,0,0.12);border:none;cursor:pointer;padding:0;flex-shrink:0;"
                title="Remove from this category"
                onclick="event.stopPropagation();quickRemoveCatFromProject('\${p.id}','\${c.replace(/'/g,\\"\\\\\\\\'\\")}')">
                <i data-lucide="x" class="w-2.5 h-2.5"></i>
            </button>
        </span>\`
    ).join('');`;

if (js.includes(oldCatBadge)) {
    js = js.replace(oldCatBadge, newCatBadge);
    console.log('✓ projectRow badge updated');
} else {
    console.error('✗ Could not find projectRow badge target');
    // Try to find what's there
    const idx = js.indexOf('badge badge-blue');
    console.log('Found badge-blue at idx:', idx);
    if (idx > -1) console.log('Context:', JSON.stringify(js.slice(idx-100, idx+200)));
}

// ─────────────────────────────────────────────────────────────────
// 2. Replace categoryRow with expanded version
// ─────────────────────────────────────────────────────────────────
const oldCatRowStart = 'function categoryRow(c, i) {\n    const count = state.projects.filter(p => (p.categories || []).includes(c.id)).length;';
const oldCatRowEnd = '    </div>\`;\n}';

const catRowStartIdx = js.indexOf(oldCatRowStart);
if (catRowStartIdx === -1) {
    console.error('✗ Could not find categoryRow function start');
} else {
    // Find the closing of the function
    const searchFrom = catRowStartIdx + oldCatRowStart.length;
    const endIdx = js.indexOf(oldCatRowEnd, searchFrom);
    if (endIdx === -1) {
        console.error('✗ Could not find categoryRow function end');
    } else {
        const fullEnd = endIdx + oldCatRowEnd.length;
        const newCategoryRow = `function categoryRow(c, i) {
    const assigned = state.projects.filter(p => (p.categories || []).includes(c.id));
    const count = assigned.length;

    const clientChips = assigned.map(p => {
        const thumb = p.thumbnail
            ? \`<img src="\${p.thumbnail}" style="width:20px;height:20px;border-radius:4px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">\`
            : \`<span style="width:20px;height:20px;border-radius:4px;background:#e5e7eb;flex-shrink:0;display:inline-block;"></span>\`;
        const safeCatId = c.id.replace(/'/g, "\\\\'");
        return \`<span style="display:inline-flex;align-items:center;gap:5px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:20px;padding:3px 8px 3px 4px;font-size:11px;color:#374151;max-width:180px;">
            \${thumb}
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px;" title="\${p.name}">\${p.name}</span>
            <button type="button" title="Remove from this category"
                style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:rgba(0,0,0,0.08);border:none;cursor:pointer;padding:0;flex-shrink:0;margin-left:2px;"
                onclick="event.stopPropagation();quickRemoveCatFromProject('\${p.id}','\${safeCatId}')">
                <i data-lucide="x" class="w-2.5 h-2.5"></i>
            </button>
        </span>\`;
    }).join('');

    const addOptions = state.projects
        .filter(p => !(p.categories || []).includes(c.id))
        .map(p => \`<option value="\${p.id}">\${p.name}</option>\`)
        .join('');

    const safeCatId2 = c.id.replace(/'/g, "\\\\'");

    return \`<div class="cat-row" id="cat-\${i}" style="flex-direction:column;align-items:stretch;gap:12px;">
        <!-- Top bar: name editor, label, delete -->
        <div style="display:flex;align-items:center;gap:12px;">
            <i data-lucide="grip-vertical" class="w-4 h-4 drag-handle" style="flex-shrink:0;"></i>
            <div style="flex:1;min-width:0;">
                <input class="form-input text-sm font-medium py-1.5" value="\${c.id}"
                    onchange="updateCatId(\${i},this.value)"
                    style="background:transparent;border-color:transparent;"
                    onfocus="this.style.borderColor='#2563eb';this.style.background='#fff'"
                    onblur="this.style.borderColor='transparent';this.style.background='transparent'">
            </div>
            <input class="form-input text-xs py-1.5" value="\${c.label}" placeholder="Short label"
                onchange="updateCatLabel(\${i},this.value)"
                style="background:#f9fafb;width:112px;flex-shrink:0;">
            <button onclick="deleteCategory(\${i})" class="btn-icon text-red-400 hover:bg-red-50" style="flex-shrink:0;">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>

        <!-- Assigned clients panel -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px;flex-wrap:wrap;">
                <span style="font-size:11px;color:#6b7280;font-weight:600;display:flex;align-items:center;gap:4px;">
                    <i data-lucide="layout-grid" class="w-3 h-3"></i>
                    \${count} client card\${count !== 1 ? 's' : ''} assigned
                </span>
                \${addOptions
                    ? \`<select style="font-size:11px;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#374151;cursor:pointer;"
                          onchange="quickAddProjectToCat(this,'\${safeCatId2}')">
                          <option value="">＋ Add client card…</option>
                          \${addOptions}
                      </select>\`
                    : \`<span style="font-size:11px;color:#16a34a;font-weight:600;">✓ All clients assigned</span>\`
                }
            </div>
            \${count > 0
                ? \`<div style="display:flex;flex-wrap:wrap;gap:6px;">\${clientChips}</div>\`
                : \`<p style="font-size:11px;color:#9ca3af;font-style:italic;margin:0;">No clients yet. Use the dropdown above to assign.</p>\`
            }
        </div>
    </div>\`;
}`;

        js = js.slice(0, catRowStartIdx) + newCategoryRow + js.slice(fullEnd);
        console.log('✓ categoryRow updated');
    }
}

// ─────────────────────────────────────────────────────────────────
// 3. Add helper functions before deleteCategory
// ─────────────────────────────────────────────────────────────────
const insertBefore = 'function deleteCategory(i) {';
const helpers = `// ── Quick category ↔ project assignment helpers ──────────────
function quickRemoveCatFromProject(projectId, catId) {
    const p = state.projects.find(x => x.id === projectId);
    if (!p) return;
    p.categories = (p.categories || []).filter(c => c !== catId);
    saveToLocalStorage();
    if (currentTab === 'projects') renderProjects();
    if (currentTab === 'categories') renderCategories();
    lucide.createIcons();
}

function quickAddProjectToCat(sel, catId) {
    if (!sel.value) return;
    const p = state.projects.find(x => x.id === sel.value);
    if (!p) { sel.value = ''; return; }
    if (!(p.categories || []).includes(catId)) {
        p.categories = [...(p.categories || []), catId];
        saveToLocalStorage();
    }
    sel.value = '';
    renderCategories();
    if (currentTab === 'projects') renderProjects();
    lucide.createIcons();
}

function deleteCategory(i) {`;

if (js.includes(insertBefore)) {
    js = js.replace(insertBefore, helpers);
    console.log('✓ Helper functions added');
} else {
    console.error('✗ Could not find deleteCategory to insert helpers before');
}

// Restore CRLF
js = js.replace(/\n/g, '\r\n');
fs.writeFileSync(file, js, 'utf8');

// Verify
const out = fs.readFileSync(file, 'utf8');
console.log('quickRemoveCatFromProject present:', out.includes('quickRemoveCatFromProject'));
console.log('quickAddProjectToCat present:', out.includes('quickAddProjectToCat'));
console.log('cat-row updated:', out.includes('Assigned clients panel'));
console.log('Done!');
