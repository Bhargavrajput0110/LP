const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
console.log('Searching reel-clip in index.html:');
lines.forEach((l, idx) => {
    const lineNum = idx + 1;
    if (l.toLowerCase().includes('reel-clip')) {
        console.log(`  Line ${lineNum}: ${l.trim().substring(0, 150)}`);
    }
});
