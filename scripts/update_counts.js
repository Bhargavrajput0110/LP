const fs = require('fs');
const path = require('path');

const projectsPath = path.join(__dirname, '../public/projects.js');
const projectsContent = fs.readFileSync(projectsPath, 'utf8');

// Evaluate the projects.js content to get __LOCAL_FALLBACK_DATA__
const mockWindow = {};
const evalFn = new Function('window', projectsContent);
evalFn(mockWindow);

const projects = mockWindow.__LOCAL_FALLBACK_DATA__.projects;

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
    "CORPORATE"
];

categories.forEach(cat => {
    const escapedCat = cat.replace(/&/g, '&amp;');
    
    // Count projects matching this category name (case-insensitive)
    const count = projects.filter(p => 
        Array.isArray(p.categories) && 
        p.categories.some(c => c.toUpperCase() === cat.toUpperCase())
    ).length;
    
    const indexRegexStr = `(<div class="category-title-card cat-clickable" data-category="${escapedCat}"[^>]*>[\\s\\S]*?<span class="cat-count-pill font-counter">)\\d+ PROJECTS (&#8594;</span>)`;
    const indexRegex = new RegExp(indexRegexStr);
    indexHtml = indexHtml.replace(indexRegex, `$1${count} PROJECTS $2`);
});

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log('Updated project counts in index.html based on projects.js');
