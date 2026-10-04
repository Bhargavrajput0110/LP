const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'main.js');
const content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
console.log('Searching WebGL/canvas/video-texture in main.js:');
lines.forEach((l, idx) => {
    const lineNum = idx + 1;
    const low = l.toLowerCase();
    if (low.includes('webgl') || 
        low.includes('canvas') || 
        low.includes('texture') || 
        low.includes('three') ||
        low.includes('uniform') ||
        low.includes('scene')) {
        console.log(`  Line ${lineNum}: ${l.trim().substring(0, 140)}`);
    }
});
