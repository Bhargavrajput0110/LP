const fs = require('fs');
const path = require('path');

// 1. Adjust styles.css
const stylesPath = path.join(__dirname, '../styles.css');
let stylesContent = fs.readFileSync(stylesPath, 'utf8');

// Normalize line endings to LF for easier search/replace
let normalizedStyles = stylesContent.replace(/\r\n/g, '\n');

const mainTarget = `.floating-socials {
    position: fixed;
    bottom: 54px;`;

const mainReplacement = `.floating-socials {
    position: fixed;
    bottom: 80px;`;

if (normalizedStyles.includes(mainTarget)) {
    normalizedStyles = normalizedStyles.replace(mainTarget, mainReplacement);
    console.log('Successfully updated main .floating-socials bottom style');
} else {
    console.log('Main .floating-socials target style not found');
}

// Save styles.css back with CRLF line endings
fs.writeFileSync(stylesPath, normalizedStyles.replace(/\n/g, '\r\n'), 'utf8');
