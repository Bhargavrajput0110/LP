const fs = require('fs');
const path = require('path');

// Ground-truth categories from generate_cards.js
const categories = [
    {
        id: "HIGH QUALITY UGC ADS",
        label: "UGC ADS",
        items: ["Black bunny", "Signature eyewear", "ESPI", "BrookFieldz", "FInca", "Pacific Consult", "Sadguru Institue", "Decathlon", "Kathiayawadi Village", "Total Dental Project", "Easydent", "Kidster", "Lexus", "Sigma University", "Nabi Sutra", "Firangi Burger", "Future Link Consultant", "Shourya International", "Bff", "Limitless x Clients", "Amar Vsl 2.0"]
    },
    {
        id: "ENTERTAINMENT & EVENTS",
        label: "ENT & EVENTS",
        items: ["Bollyverse", "Frequencies", "Alembic Art District", "Kalakars", "EO Vadodara", "Triggers", "Credi Vadodara", "Time Fashion Week", "Alembic", "Bff", "B249"]
    },
    {
        id: "FASHION & JEWELS",
        label: "FASHION",
        items: ["Wovenloft", "Kashi", "Juhi Lakhani", "Amreen Khan", "GGJ", "Skaid", "Ganga sarees", "White Lion Jewks", "Amya", "Mandap", "Yogeshwar Arts", "Vasper", "Insanity", "RK JEWELS", "Luce & Ombra", "Luce & amp; Ombra"]
    },
    {
        id: "SPORTS & ACTIVEWEAR",
        label: "SPORTS",
        items: ["Leocor", "Fitness Track", "T2 sports", "Vadodara Combat association", "Vaco India", "Om ayurveda", "Mx store", "IGC", "Gymnation", "FIt Freak", "Decathlon Baroda", "X speed", "Kelo India", "Ajay tennis", "FXR"]
    },
    {
        id: "FOOD & BEVERAGE",
        label: "FOOD & BEV",
        items: ["Firangi Burgers", "Rocksoul Cafe", "Southak", "Tasir masala", "The Pizza Planet", "Orchid", "Fortune Vadodara", "Mars", "Finca Restro Cafe", "Koa Cafe", "Fortune Inn Promenade", "Kathiyawadi Village", "Southa", "Firangi Burger"]
    },
    {
        id: "REAL ESTATE & INTERIORS & ARCHITECTURE",
        label: "REAL ESTATE",
        items: ["Brookfieldz", "Lixus", "Lixus Space LLP", "Crossboundries", "Suba Elite", "Aries Groups", "Yesha Modi", "Shreenath", "Reva clublife & Reva landmark", "Inventia", "Humble Homes", "The Crossboundaries", "Suba Group"]
    },
    {
        id: "HEALTHCARE & BEAUTY",
        label: "HEALTH & BEAUTY",
        items: ["Dr. Priyanka", "Easydent", "Vasu", "Vidhisha", "V salon", "Facetyme", "Nabhisutra", "Kingeworld", "Reach home safe", "Chandad dental", "The Dental Project", "Jawed Habib", "Trichup", "Vasu Healthcare"]
    },
    {
        id: "EDUCATION & CONSULTANCY",
        label: "EDUCATION",
        items: ["Sigma University", "Sadguru School", "Sadguru Institute", "you vs you", "Future Link", "ESPI", "CL LST", "Sadguru School"]
    },
    {
        id: "LIFESTYLE & LUXURY",
        label: "LIFESTYLE",
        items: ["Signature Eyewear", "Optic House", "White Lion Jewels", "Kidster"]
    },
    {
        id: "CORPORATE",
        label: "CORPORATE",
        items: ["Shaily", "Metso", "Concentrix", "Paushak", "Art Dada Prop Studio"]
    }
];

const collagePath = path.join(__dirname, '../public/collage.html');
const content = fs.readFileSync(collagePath, 'utf8');

// First, extract all articles from anywhere in collage.html to compile detailed project data
const articleRegex = /<article[\s\S]*?<\/article>/g;
const allArticles = content.match(articleRegex) || [];

const projectsByName = new Map();

for (const article of allArticles) {
    const nameMatch = article.match(/<h3 class="card-name">([^<]+)<\/h3>/);
    if (!nameMatch) continue;
    const rawName = nameMatch[1].trim();
    // Normalize name
    let name = rawName.toUpperCase();
    if (name === "LUCE &AMP; OMBRA") {
        name = "LUCE & OMBRA";
    }

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

    let thumbnail = '';
    let logo = '';

    const mediaMatch = article.match(/<div class="card-media">([\s\S]*?)<\/div>\s*<div class="card-info">/);
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

    // Merge logic
    if (projectsByName.has(name)) {
        const existing = projectsByName.get(name);
        if (!existing.reel && reel) existing.reel = reel;
        if (!existing.reel1 && reel1) existing.reel1 = reel1;
        if (!existing.reel2 && reel2) existing.reel2 = reel2;
        if (!existing.reel3 && reel3) existing.reel3 = reel3;
        if (!existing.instagram && instagram) existing.instagram = instagram;
        if (!existing.logo && logo) existing.logo = logo;
        if (!existing.desc && desc) existing.desc = desc;
        if (mood !== 'pureWhite' && existing.mood === 'pureWhite') existing.mood = mood;
    } else {
        projectsByName.set(name, {
            name: name, // We will map it back to proper casing later
            rawName: rawName,
            mood,
            desc,
            thumbnail,
            logo,
            reel,
            reel1,
            reel2,
            reel3,
            instagram,
            categories: []
        });
    }
}

// Map names to categories based on ground-truth array
const finalProjects = [];
const unmatched = [];

projectsByName.forEach((proj, nameKey) => {
    const matchedCategories = [];
    
    categories.forEach(cat => {
        const hasMatch = cat.items.some(item => {
            const itemUpper = item.toUpperCase().replace(/&AMP;/g, '&');
            return nameKey === itemUpper || 
                   nameKey.replace(/\s+/g, '') === itemUpper.replace(/\s+/g, '') ||
                   (nameKey.length > 5 && (nameKey.includes(itemUpper) || itemUpper.includes(nameKey)));
        });
        
        if (hasMatch) {
            matchedCategories.push(cat.id);
        }
    });

    if (matchedCategories.length > 0) {
        proj.categories = matchedCategories;
        // Clean rawName if it is all caps, restore original casing from ground truth if possible
        let displayName = proj.rawName;
        // Find best match in category items for casing
        for (const cat of categories) {
            for (const item of cat.items) {
                if (item.toUpperCase().replace(/&AMP;/g, '&') === nameKey) {
                    displayName = item;
                    break;
                }
            }
        }
        proj.name = displayName;
        delete proj.rawName;
        finalProjects.push(proj);
    } else {
        unmatched.push(proj.rawName);
    }
});

console.log(`Matched ${finalProjects.length} projects to ground-truth categories.`);
if (unmatched.length > 0) {
    console.log(`Unmatched project names (ignored or fallback to general if any):`, unmatched);
}

const outputContent = `// Local Fallback Projects Data for Limitless Productions CMS
window.__LOCAL_FALLBACK_DATA__ = {
    projects: ${JSON.stringify(finalProjects, null, 4)}
};
`;

const outputPath = path.join(__dirname, '../public/projects.js');
fs.writeFileSync(outputPath, outputContent, 'utf8');
console.log(`Successfully generated clean projects.js file at ${outputPath}`);
