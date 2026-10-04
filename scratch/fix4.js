const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\backup-l[\\LP';

const indexPath = path.join(rootDir, 'index.html');
if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    content = content.replace(/GSFC College/g, 'Vadodara');
    fs.writeFileSync(indexPath, content, 'utf8');
}

const contactPath = path.join(rootDir, 'public', 'fragments', 'contact-overlay.html');
if (fs.existsSync(contactPath)) {
    let content = fs.readFileSync(contactPath, 'utf8');
    content = content.replace(/GSFC College/g, 'Vadodara');
    fs.writeFileSync(contactPath, content, 'utf8');
}

console.log('Changed GSFC College back to Vadodara.');
