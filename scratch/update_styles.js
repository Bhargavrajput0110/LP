const fs = require('fs');
const path = require('path');

const stylesPath = path.join(__dirname, '../styles.css');
let content = fs.readFileSync(stylesPath, 'utf8');

const target = `.floating-socials .social-line {
            width: 1px; height: 48px;
            background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.15));
        }`;

const replacement = `.floating-socials .social-line {
            width: 1px; height: 48px;
            background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.15));
        }
        .social-btns-row {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 12px;
        }`;

// Standardize line endings to perform replace, then write back
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');
const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
    const updated = normalizedContent.replace(normalizedTarget, normalizedReplacement);
    // Write back with original line endings (CRLF for Windows)
    fs.writeFileSync(stylesPath, updated.replace(/\n/g, '\r\n'), 'utf8');
    console.log('Successfully updated styles.css with .social-btns-row');
} else {
    console.log('Target string not found in styles.css');
}
