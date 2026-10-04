const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
console.log('Searching video elements in index.html:');
lines.forEach((l, idx) => {
    const lineNum = idx + 1;
    const low = l.toLowerCase();
    if (low.includes('<video') || 
        low.includes('video-') || 
        low.includes('gateway-window') || 
        low.includes('koa') ||
        low.includes('horizontal')) {
        console.log(`  Line ${lineNum}: ${l.trim().substring(0, 150)}`);
    }
});
