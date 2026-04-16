const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// 1. Extract CSS
const styleRegex = /<style>([\s\S]*?)<\/style>/i;
const styleMatch = html.match(styleRegex);
if (styleMatch) {
    fs.writeFileSync('styles.css', styleMatch[1].trim());
    html = html.replace(styleRegex, '<link rel="stylesheet" href="styles.css">\n    <meta name="theme-color" content="#0A0A0F">\n    <link rel="icon" href="/favicon.ico">');
    console.log('Extracted styles.css');
}

// 2. Add defer to external script tags
html = html.replace(/<script src="([^"]+)"><\/script>/g, (match, src) => {
    if (src.includes('tailwindcss.com') || match.includes('defer')) {
        return match;
    }
    return `<script src="${src}" defer></script>`;
});

// 3. Extract main js module
const scriptRegex = /<script\s+type="module"\s*>([\s\S]*?)<\/script>/gi;
let match;
while ((match = scriptRegex.exec(html)) !== null) {
    if (match[1].length > 10000) {
        fs.writeFileSync('main.js', match[1].trim());
        html = html.replace(match[0], '<script type="module" src="main.js" defer></script>');
        console.log('Extracted main.js');
        break; // Only extract the biggest one
    }
}

// 4. Lazy loading for non-critical assets
html = html.replace(/<img(.*?)>/gi, (match, attrs) => {
    if (!attrs.includes('loading')) {
        // Exception logic based on attributes
        if (!attrs.includes('logo') && !attrs.includes('hero')) {
             return `<img${attrs} loading="lazy">`;
        }
    }
    return match;
});

html = html.replace(/<video(.*?)>/gi, (match, attrs) => {
    if (!attrs.includes('preload') && !attrs.includes('hero')) {
        return `<video${attrs} preload="none">`;
    }
    return match;
});

fs.writeFileSync('index.html', html);
console.log('index.html updated successfully with SEO and performance improvements.');
