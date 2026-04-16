const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// Add Lazy loading for images
html = html.replace(/<img(.*?)>/gi, (match, attrs) => {
    if (!attrs.includes('loading')) {
         return `<img${attrs} loading="lazy">`;
    }
    return match;
});

fs.writeFileSync('index.html', html);
console.log('✅ Added lazy loading to images in index.html to improve performance.');
