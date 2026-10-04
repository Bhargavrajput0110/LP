const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    console.log('Navigating to live site...');
    await page.goto('https://limitlessproductions.netlify.app/');
    
    // Wait for the category cards to render
    await page.waitForSelector('.category-title-card[data-category="LIFESTYLE & LUXURY"]');
    
    // Click the category card
    console.log('Clicking category card...');
    await page.click('.category-title-card[data-category="LIFESTYLE & LUXURY"]');
    
    // Wait for the overlay to appear
    await page.waitForSelector('.cat-collage-overlay[style*="display: block"]', { timeout: 10000 });
    
    // Wait for the active grid
    await page.waitForSelector('.cat-grid.active', { timeout: 10000 });
    
    // Get the HTML of the active grid
    const html = await page.evaluate(() => {
        const grid = document.querySelector('.cat-grid.active');
        if (!grid) return 'Grid not found';
        
        // Also get some computed styles of the first project card
        const firstCard = grid.querySelector('.project-card');
        let styles = '';
        if (firstCard) {
            const cs = window.getComputedStyle(firstCard);
            styles = `Display: ${cs.display}, Opacity: ${cs.opacity}, Visibility: ${cs.visibility}, Width: ${cs.width}, Height: ${cs.height}, Z-index: ${cs.zIndex}`;
        }
        
        return {
            html: grid.innerHTML,
            styles: styles,
            cardCount: grid.querySelectorAll('.project-card').length,
            classes: grid.className
        };
    });
    
    console.log('Active Grid Info:', html);
    
    await browser.close();
})();
