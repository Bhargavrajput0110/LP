const fs = require('fs');
const path = require('path');

const collagePath = path.join(__dirname, '../public/collage.html');
const collage = fs.readFileSync(collagePath, 'utf8');

const indexHtmlPath = path.join(__dirname, '../index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const categories = [
    "HIGH QUALITY UGC ADS",
    "ENTERTAINMENT & EVENTS",
    "FASHION & JEWELS",
    "SPORTS & ACTIVEWEAR",
    "FOOD & BEVERAGE",
    "REAL ESTATE & INTERIORS & ARCHITECTURE",
    "HEALTHCARE & BEAUTY",
    "EDUCATION & CONSULTANCY",
    "LIFESTYLE & LUXURY",
    "Corporate"
];

categories.forEach(cat => {
    const escapedCat = cat.replace(/&/g, '&amp;');
    const regexStr = `(<div class="cat-grid" data-cat="${escapedCat}">)([\\s\\S]*?)(</div>\\s*(?:<!-- \\d{2}:|</div><!-- end cat-collage-body))`;
    const regex = new RegExp(regexStr);
    
    const match = collage.match(regex);
    if (match) {
        const blockContent = match[2];
        const countMatch = blockContent.match(/<article class="project-card/g);
        const count = countMatch ? countMatch.length : 0;
        
        const indexRegexStr = `(<div class="category-title-card cat-clickable" data-category="${escapedCat}"[^>]*>[\\s\\S]*?<span class="cat-count-pill font-counter">)\\d+ PROJECTS (&#8594;</span>)`;
        const indexRegex = new RegExp(indexRegexStr);
        indexHtml = indexHtml.replace(indexRegex, `$1${count} PROJECTS $2`);
    }
});

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log('Updated project counts in index.html');
