const fs = require('fs');

const html = fs.readFileSync('d:/backup-l[/LP/index.html', 'utf8');

// I need to find the project cards
// Let's use a simple regex to find all <div class="project-card ..."> 
const lines = html.split('\n');

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('id="project-grid"')) {
        startIndex = i;
    }
    if (startIndex !== -1 && i > startIndex && lines[i].includes('<!-- Desktop Grid -->')) {
        // wait, project-grid might end earlier
    }
}

// Alternatively, let's just dump the first project card to see its structure
const projectRegex = /<div class="project-card[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
let match = projectRegex.exec(html);
if (match) {
    console.log("Found project card block:");
    console.log(match[0].substring(0, 500) + "...");
} else {
    console.log("No project cards found with regex");
}
