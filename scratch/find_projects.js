const fs = require('fs');
const html = fs.readFileSync('d:/backup-l[/LP/index.html', 'utf8');
const lines = html.split('\n');

let count = 0;
for(let i = 0; i < lines.length; i++) {
    if (lines[i].includes('data-title=')) {
        console.log(`Line ${i}:`, lines[i].trim().substring(0, 80));
        count++;
    }
}
console.log(`Total data-title elements: ${count}`);
