const fs = require('fs');
const path = require('path');

const files = [
    path.join(__dirname, '../public/collage.html'),
    path.join(__dirname, '../index.html'),
    path.join(__dirname, '../main.js'),
    path.join(__dirname, '../character-card.html')
];

files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // 1. Optimize Cloudinary URL parameters for 9:16 vertical reels
        // We replace any sequence of upload/.../v with our heavily optimized 9:16 string.
        content = content.replace(/upload\/.*?\/v(\d+)/g, 'upload/q_auto:eco,f_auto,w_600,c_fill,ar_9:16,br_800k/v$1');

        // 2. Change preload="none" to preload="metadata" on video tags
        content = content.replace(/preload="none"/g, 'preload="metadata"');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Optimized: ${filePath}`);
    } else {
        console.log(`File not found: ${filePath}`);
    }
});
