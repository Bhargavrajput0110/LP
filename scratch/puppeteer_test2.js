const puppeteer = require('puppeteer');
const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.stack || error.message));

        console.log('Navigating to local site...');
        await page.goto('http://127.0.0.1:5501/index.html', { waitUntil: 'networkidle0', timeout: 30000 });

        console.log('Wait 2s for GSAP to settle...');
        await delay(2000);

        console.log('Clicking a project card...');
        // Find a visible project card in the WORK section
        await page.evaluate(() => {
            const card = document.querySelector('.project-card');
            if (card) card.click();
        });

        console.log('Waiting 2s for reveal to open...');
        await delay(2000);

        console.log('Clicking BACK button...');
        await page.evaluate(() => {
            const backBtn = document.querySelector('.pr-close');
            if (backBtn) backBtn.click();
        });

        console.log('Waiting 2s to see if it freezes...');
        await delay(2000);

        console.log('Checking responsiveness by evaluating JS...');
        const isResponsive = await page.evaluate(() => {
            return document.querySelector('#project-reveal').style.display;
        });
        console.log('Reveal display is:', isResponsive);

        await browser.close();
        console.log('Test complete without freeze.');
    } catch (e) {
        console.error('TEST FAILED:', e.stack || e.message);
    }
})();