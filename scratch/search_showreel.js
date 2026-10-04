const fs = require('fs');
const path = require('path');

const files = ['index.html', 'main.js'];
files.forEach(f => {
    const fullPath = path.join(__dirname, '..', f);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    console.log(`=== Showreel matches in ${f} ===`);
    lines.forEach((l, idx) => {
        const lineNum = idx + 1;
        const low = l.toLowerCase();
        if (low.includes('showreel')) {
            console.log(`  Line ${lineNum}: ${l.trim().substring(0, 150)}`);
        }
    });
});
