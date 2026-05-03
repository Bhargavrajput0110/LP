const fs = require('fs');
const path = require('path');

const collagePath = path.join(__dirname, '../public/collage.html');
let html = fs.readFileSync(collagePath, 'utf8');

const categories = [
    {
        id: "HIGH QUALITY UGC ADS",
        label: "UGC ADS",
        items: ["Black bunny", "Signature eyewear", "ESPI", "BrookFieldz", "FInca", "Pacific Consult", "Sadguru Institue", "Decathlon", "Kathiayawadi Village", "Total Dental Project", "Easydent", "Kidster", "Lexus", "Sigma University", "Nabi Sutra", "Firangi Burger", "Future Link Consultant", "Shourya International", "Bff"]
    },
    {
        id: "ENTERTAINMENT & EVENTS",
        label: "ENT & EVENTS",
        items: ["Bollyverse", "Frequencies", "Alembic Art District", "Kalakars", "EO Vadodara", "Triggers", "Credi Vadodara", "Time Fashion Week", "Alembic", "Bff", "B249"]
    },
    {
        id: "FASHION & JEWELS",
        label: "FASHION",
        items: ["Wovenloft", "Kashi", "Juhi Lakhani", "Amreen Khan", "GGJ", "Skaid", "Ganga sarees", "White Lion Jewks", "Amya", "Mandap", "Yogeshwar Arts", "Vasper", "Insanity", "RK JEWELS"]
    },
    {
        id: "SPORTS & ACTIVEWEAR",
        label: "SPORTS",
        items: ["Leocor", "Fitness Track", "T2 sports", "Vadodara Combat association", "Vaco India", "Om ayurveda", "Mx store", "IGC", "Gymnation", "FIt Freak", "Decathlon Baroda", "X speed", "Kelo India", "Ajay tennis", "FXR"]
    },
    {
        id: "FOOD & BEVERAGE",
        label: "FOOD & BEV",
        items: ["Firangi Burgers", "Rocksoul Cafe", "Southak", "Tasir masala", "The Pizza Planet", "Orchid", "Fortune Vadodara", "Mars", "Finca Restro Cafe", "Koa Cafe", "Fortune Inn Promenade", "Kathiyawadi Village"]
    },
    {
        id: "REAL ESTATE & INTERIORS & ARCHITECTURE",
        label: "REAL ESTATE",
        items: ["Brookfieldz", "Lixus", "Lixus Space LLP", "Crossboundries", "Suba Elite", "Aries Groups", "Yesha Modi", "Shreenath", "Reva clublife & Reva landmark", "Inventia", "Humble Homes"]
    },
    {
        id: "HEALTHCARE & BEAUTY",
        label: "HEALTH & BEAUTY",
        items: ["Dr. Priyanka", "Easydent", "Vasu", "Vidhisha", "V salon", "Facetyme", "Nabhisutra", "Kingeworld", "Reach home safe", "Chandad dental", "The Dental Project", "Jawed Habib", "Trichup"]
    },
    {
        id: "EDUCATION & CONSULTANCY",
        label: "EDUCATION",
        items: ["Sigma University", "Sadguru School", "Sadguru Institute", "you vs you", "Future Link", "ESPI", "CL LST"]
    },
    {
        id: "LIFESTYLE & LUXURY",
        label: "LIFESTYLE",
        items: ["Signature Eyewear", "Optic House", "White Lion Jewels", "Kidster"]
    },
    {
        id: "OTHERS",
        newId: "Corporate",
        label: "CORPORATE",
        items: ["Shaily", "Metso", "Concentrix", "Paushak", "Art Dada Prop Studio"]
    }
];

categories.forEach(cat => {
    const searchId = cat.id;
    const newId = cat.newId || cat.id;
    
    const escapedSearchId = searchId.replace(/&/g, '&amp;');
    const escapedNewId = newId.replace(/&/g, '&amp;');

    const regexStr = `(<div class="cat-grid" data-cat="${escapedSearchId}">)([\\s\\S]*?)(</div>\\s*<!-- \\d{2}:|</div>\\s*</div><!-- end cat-collage-body)`;
    const regex = new RegExp(regexStr);
    
    const match = html.match(regex);
    if (match) {
        let blockStart = match[1];
        let blockContent = match[2];
        let blockEnd = match[3];

        if (blockContent.includes('VAULT_PENDING')) {
            blockContent = '';
        }

        const existingNames = [];
        const cardRegex = /<h3 class="card-name">(.*?)<\/h3>/g;
        let cardMatch;
        while ((cardMatch = cardRegex.exec(blockContent)) !== null) {
            existingNames.push(cardMatch[1].trim().toUpperCase());
        }

        let maxId = 0;
        const idRegex = /<span class="card-id">(\d+)<\/span>/g;
        let idMatch;
        while ((idMatch = idRegex.exec(blockContent)) !== null) {
            const id = parseInt(idMatch[1], 10);
            if (id > maxId) maxId = id;
        }

        const newBlockStart = `<div class="cat-grid" data-cat="${escapedNewId}">`;
        let newBlockContent = blockContent;

        cat.items.forEach(item => {
            const itemUpper = item.trim().toUpperCase();
            
            const isDuplicate = existingNames.some(ex => 
                ex === itemUpper || ex.includes(itemUpper) || itemUpper.includes(ex)
            );

            if (!isDuplicate) {
                maxId++;
                const idStr = maxId.toString().padStart(2, '0');
                const itemEscaped = item.replace(/"/g, '&quot;');

                const newCard = `
                                <article class="project-card glass" data-mood="pureWhite" data-cursor="VIEW" data-desc="Project ${itemEscaped}." 
                                         data-reel=""
                                         data-reel1=""
                                         data-reel2=""
                                         data-reel3="">
                                    <div class="card-media">
                                        <img src="https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=2000" alt="${itemEscaped}" loading="lazy" width="800" height="800">
                                        <div class="card-brand-logo"></div>
                                        <div class="card-overlay"></div>
                                        <div class="card-cursor-inner font-counter">VIEW</div>
                                    </div>
                                    <div class="card-info"><h3 class="card-name">${itemUpper}</h3><div class="card-sub font-counter"><span class="card-id">${idStr}</span><span class="dot">-+</span>${cat.label}</div></div>
                                </article>`;
                newBlockContent += '\n' + newCard;
            }
        });

        html = html.replace(match[0], newBlockStart + newBlockContent + '\n                            ' + blockEnd);
    }
});

html = html.replace(/<!-- 10: OTHERS -->/g, '<!-- 10: Corporate -->');

fs.writeFileSync(collagePath, html, 'utf8');
console.log('Updated collage.html');

const indexHtmlPath = path.join(__dirname, '../index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

indexHtml = indexHtml.replace(/data-category="OTHERS"/g, 'data-category="Corporate"');
indexHtml = indexHtml.replace(/<h2 class="font-display">OTHERS<\/h2>/g, '<h2 class="font-display">CORPORATE</h2>');
indexHtml = indexHtml.replace(
    /<span class="font-counter text-\[10px\] tracking-\[0.3em\] text-white\/60 hover:text-\[var\(--scene-accent\)\] hover:translate-x-2 transition-all cursor-pointer px-4 py-3 rounded-lg hover:bg-white\/5">OTHERS<\/span>/g, 
    '<span class="font-counter text-[10px] tracking-[0.3em] text-white/60 hover:text-[var(--scene-accent)] hover:translate-x-2 transition-all cursor-pointer px-4 py-3 rounded-lg hover:bg-white/5">Corporate</span>'
);

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log('Updated index.html');
