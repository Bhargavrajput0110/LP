const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'main.js');
const content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
console.log('Searching .muted assignments in main.js:');
lines.forEach((l, idx) => {
    const lineNum = idx + 1;
    if (l.includes('.muted =') || l.includes('muted =')) {
        console.log(`  Line ${lineNum}: ${l.trim().substring(0, 150)}`);
    }
});
