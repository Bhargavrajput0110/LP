const fs = require('fs');
const path = require('path');
const rootDir = path.join(__dirname, '..');
const files = ['index.html', 'main.js', 'styles.css'];

console.log('Root directory:', rootDir);

files.forEach(f => {
    const fullPath = path.join(rootDir, f);
    if (!fs.existsSync(fullPath)) {
        console.log(`${fullPath} does not exist`);
        return;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`=== Matches in ${f} ===`);
    const lines = content.split('\n');
    lines.forEach((l, idx) => {
        const lineNum = idx + 1;
        const low = l.toLowerCase();
        if (low.includes('video') || 
            low.includes('player') || 
            low.includes('iframe') || 
            low.includes('koa') ||
            low.includes('mute') ||
            low.includes('play') ||
            low.includes('audio')) {
            console.log(`  Line ${lineNum}: ${l.trim().substring(0, 120)}`);
        }
    });
});
