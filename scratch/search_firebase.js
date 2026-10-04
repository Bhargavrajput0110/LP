const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'firebase-site.js');
if (!fs.existsSync(file)) {
    console.log(`${file} does not exist`);
    return;
}
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
console.log('Searching video/audio in firebase-site.js:');
lines.forEach((l, idx) => {
    const lineNum = idx + 1;
    const low = l.toLowerCase();
    if (low.includes('video') || 
        low.includes('reel') || 
        low.includes('play') || 
        low.includes('audio') ||
        low.includes('mute')) {
        console.log(`  Line ${lineNum}: ${l.trim().substring(0, 150)}`);
    }
});
