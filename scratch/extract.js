const fs = require('fs');
const path = require('path');

const collagePath = path.join(__dirname, '../public/collage.html');
const content = fs.readFileSync(collagePath, 'utf8');

// Find all occurrences of `<div class="cat-grid" data-cat="...">`
const gridHeaderRegex = /<div class="cat-grid"\s+data-cat="([^"]+)">/g;
const gridMatches = [];
let match;
while ((match = gridHeaderRegex.exec(content)) !== null) {
    gridMatches.push({
        catAttr: match[1],
        index: match.index,
        headerLength: match[0].length
    });
}

const projectsMap = new Map();

for (let i = 0; i < gridMatches.length; i++) {
    const current = gridMatches[i];
    const catAttr = current.catAttr;
    const catName = catAttr.replace(/&amp;/g, '&');
    
    // Find the end of this grid content.
    // It ends either at the start of the next grid, or at the end of the collage body.
    const startIdx = current.index + current.headerLength;
    let endIdx;
    
    if (i < gridMatches.length - 1) {
        endIdx = gridMatches[i + 1].index;
    } else {
        // Find the ending markers like `</div>\s*</div><!-- end cat-collage-body`
        const endMarker = content.indexOf('<!-- end cat-collage-body', startIdx);
        if (endMarker !== -1) {
            endIdx = endMarker;
        } else {
            endIdx = content.length;
        }
    }
    
    let gridContent = content.substring(startIdx, endIdx);
    
    // Clean up trailing tags in gridContent (e.g. closing </div> and comments)
    const lastClosingDiv = gridContent.lastIndexOf('</div>');
    if (lastClosingDiv !== -1) {
        gridContent = gridContent.substring(0, lastClosingDiv);
    }

    const articleRegex = /<article[\s\S]*?<\/article>/g;
    const articles = gridContent.match(articleRegex) || [];
    
    console.log(`Grid "${catName}" (attr "${catAttr}") has ${articles.length} articles.`);
    
    // Map of labels for categories
    const catLabels = {
        'HIGH QUALITY UGC ADS': 'UGC ADS',
        'ENTERTAINMENT & EVENTS': 'ENT & EVENTS',
        'FASHION & JEWELS': 'FASHION',
        'SPORTS & ACTIVEWEAR': 'SPORTS',
        'FOOD & BEVERAGE': 'FOOD & BEV',
        'REAL ESTATE & INTERIORS & ARCHITECTURE': 'REAL ESTATE',
        'HEALTHCARE & BEAUTY': 'HEALTH & BEAUTY',
        'EDUCATION & CONSULTANCY': 'EDUCATION',
        'LIFESTYLE & LUXURY': 'LIFESTYLE',
        'CORPORATE': 'CORPORATE'
    };
    const catLabel = catLabels[catName.toUpperCase()] || catName;

    for (const article of articles) {
        // Extract attributes
        const moodMatch = article.match(/data-mood="([^"]*)"/);
        const mood = moodMatch ? moodMatch[1] : 'pureWhite';

        const descMatch = article.match(/data-desc="([^"]*)"/);
        const desc = descMatch ? descMatch[1] : '';

        const reelMatch = article.match(/data-reel="([^"]*)"/);
        const reel = reelMatch ? reelMatch[1] : '';

        const reel1Match = article.match(/data-reel1="([^"]*)"/);
        const reel1 = reel1Match ? reel1Match[1] : '';

        const reel2Match = article.match(/data-reel2="([^"]*)"/);
        const reel2 = reel2Match ? reel2Match[1] : '';

        const reel3Match = article.match(/data-reel3="([^"]*)"/);
        const reel3 = reel3Match ? reel3Match[1] : '';

        const instaMatch = article.match(/data-instagram="([^"]*)"/);
        const instagram = instaMatch ? instaMatch[1] : '';

        // Extract media src
        const mediaMatch = article.match(/<div class="card-media">([\s\S]*?)<\/div>\s*<div class="card-info">/);
        let thumbnail = '';
        let logo = '';

        const mediaContent = mediaMatch ? mediaMatch[1] : article;
        
        const imgMatch = mediaContent.match(/<img[^>]+src="([^"]+)"/);
        if (imgMatch) {
            thumbnail = imgMatch[1];
        }

        const brandLogoMatch = mediaContent.match(/<div class="card-brand-logo">([\s\S]*?)<\/div>/);
        if (brandLogoMatch) {
            const brandImgMatch = brandLogoMatch[1].match(/<img[^>]+src="([^"]+)"/);
            if (brandImgMatch) {
                logo = brandImgMatch[1];
            }
        }

        // Extract name
        const nameMatch = article.match(/<h3 class="card-name">([^<]+)<\/h3>/);
        let name = '';
        if (nameMatch) {
            name = nameMatch[1].trim();
        }

        if (!name) continue;

        // Normalize name for keying
        const key = name.toUpperCase();
        if (projectsMap.has(key)) {
            const existing = projectsMap.get(key);
            if (!existing.categories.includes(catName)) {
                existing.categories.push(catName);
            }
            // Merge fields if existing is empty but new has it
            if (!existing.reel && reel) existing.reel = reel;
            if (!existing.reel1 && reel1) existing.reel1 = reel1;
            if (!existing.reel2 && reel2) existing.reel2 = reel2;
            if (!existing.reel3 && reel3) existing.reel3 = reel3;
            if (!existing.instagram && instagram) existing.instagram = instagram;
            if (!existing.logo && logo) existing.logo = logo;
            if (!existing.desc && desc) existing.desc = desc;
        } else {
            projectsMap.set(key, {
                name,
                categories: [catName],
                mood,
                desc,
                thumbnail,
                logo,
                reel,
                reel1,
                reel2,
                reel3,
                instagram
            });
        }
    }
}

const projectsList = Array.from(projectsMap.values());

const outputContent = `// Local Fallback Projects Data for Limitless Productions CMS
window.__LOCAL_FALLBACK_DATA__ = {
    projects: ${JSON.stringify(projectsList, null, 4)}
};
`;

const outputPath = path.join(__dirname, '../public/projects.js');
fs.writeFileSync(outputPath, outputContent, 'utf8');
console.log(`Successfully extracted ${projectsList.length} unique projects into ${outputPath}`);
