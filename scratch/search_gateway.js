const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'main.js');
const content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
console.log('Searching gateway in main.js:');
lines.forEach((l, idx) => {
    const lineNum = idx + 1;
    const low = l.toLowerCase();
    if (low.includes('gateway')) {
        console.log(`  Line ${lineNum}: ${l.trim().substring(0, 150)}`);
    }
});
