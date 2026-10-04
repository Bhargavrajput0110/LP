const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
console.log('Searching track and project-card inside index.html:');
lines.forEach((l, idx) => {
    const lineNum = idx + 1;
    const low = l.toLowerCase();
    if (low.includes('track') || low.includes('spine') || low.includes('project-card')) {
        console.log(`  Line ${lineNum}: ${l.trim().substring(0, 150)}`);
    }
});
