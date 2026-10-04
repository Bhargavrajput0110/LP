const fs = require('fs');
const path = require('path');

const collagePath = path.join(__dirname, '../public/collage.html');
const content = fs.readFileSync(collagePath, 'utf8');

const regex = /data-cat="([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
    console.log(match[0]);
}
