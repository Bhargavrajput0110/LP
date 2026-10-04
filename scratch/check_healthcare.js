const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../public/collage.html'), 'utf8');

const gridHeaderRegex = /<div class="cat-grid"\s+data-cat="HEALTHCARE &amp; BEAUTY">/g;
const matches = [];
let match;
while ((match = gridHeaderRegex.exec(content)) !== null) {
    matches.push({ index: match.index, length: match[0].length });
}

matches.forEach((m, idx) => {
    // Find the next grid or ending tag
    const nextGrid = content.indexOf('<div class="cat-grid"', m.index + m.length);
    const endIdx = nextGrid !== -1 ? nextGrid : content.indexOf('<!-- end cat-collage-body', m.index + m.length);
    
    const gridContent = content.substring(m.index + m.length, endIdx);
    const articles = gridContent.match(/<article[\s\S]*?<\/article>/g) || [];
    
    console.log(`Grid ${idx} has ${articles.length} articles.`);
    articles.forEach((a, j) => {
        const name = a.match(/<h3 class="card-name">([^<]+)<\/h3>/);
        console.log(`  Article ${j}: ${name ? name[1].trim() : 'unknown'}`);
    });
});
