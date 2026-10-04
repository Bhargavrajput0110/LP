const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'main.js');
const content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
console.log('Searching main.js video/audio/autoplay configurations:');
lines.forEach((l, idx) => {
    const lineNum = idx + 1;
    const low = l.toLowerCase();
    if (low.includes('video') || 
        low.includes('autoplay') || 
        low.includes('horizontal') || 
        low.includes('mute') || 
        low.includes('sound')) {
        // Only print if it seems relevant to configuration or event handling
        if (low.includes('player') || low.includes('play') || low.includes('volume') || low.includes('scroll') || low.includes('audio') || low.includes('koa')) {
            console.log(`  Line ${lineNum}: ${l.trim().substring(0, 140)}`);
        }
    }
});
