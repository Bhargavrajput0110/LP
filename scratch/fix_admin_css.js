const path = require('path');
const fs = require('fs');
const file = path.resolve('d:/backup-l[/LP/admin.html');
let html = fs.readFileSync(file, 'utf8');
html = html.replace(/\r\n/g, '\n');

const afterTarget = `.cat-row:hover {
            border-color: #bfdbfe;
            background: #f8fbff;
        }`;

const newStyles = `.cat-row:hover {
            border-color: #bfdbfe;
            background: #f8fbff;
        }

        /* ── Category: assigned-clients panel ── */
        .cat-chip-x {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: rgba(0,0,0,0.08);
            border: none;
            cursor: pointer;
            padding: 0;
            flex-shrink: 0;
            color: #6b7280;
            transition: background 0.15s, color 0.15s;
        }
        .cat-chip-x:hover {
            background: #ef4444;
            color: #fff;
        }

        /* ── Project list: removable category badge ── */
        .badge-blue .cat-badge-x {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 13px;
            height: 13px;
            border-radius: 50%;
            background: rgba(30,64,175,0.15);
            border: none;
            cursor: pointer;
            padding: 0;
            flex-shrink: 0;
            color: #1e40af;
            transition: background 0.15s, color 0.15s;
        }
        .badge-blue .cat-badge-x:hover {
            background: #ef4444;
            color: #fff;
        }`;

if (html.includes(afterTarget)) {
    html = html.replace(afterTarget, newStyles);
    console.log('✓ CSS injected after .cat-row:hover');
} else {
    console.error('✗ Still cannot find target');
    process.exit(1);
}

html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(file, html, 'utf8');

const out = fs.readFileSync(file, 'utf8');
console.log('.cat-chip-x present:', out.includes('.cat-chip-x'));
console.log('.cat-badge-x present:', out.includes('.cat-badge-x'));
console.log('Done!');
