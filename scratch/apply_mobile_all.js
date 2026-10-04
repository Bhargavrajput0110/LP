const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\backup-l[\\LP';
const addFile = path.join(rootDir, 'scratch', 'mobile_additions.css');
const cssFile = path.join(rootDir, 'styles.css');
const minCssFile = path.join(rootDir, 'styles.min.css');

if (fs.existsSync(addFile)) {
    const add = fs.readFileSync(addFile, 'utf8');

    // Prevent double appending
    const currentCss = fs.readFileSync(cssFile, 'utf8');
    if (!currentCss.includes('MOBILE OPTIMIZATION ENHANCEMENTS')) {
        fs.appendFileSync(cssFile, '\n' + add, 'utf8');
        console.log('Appended to styles.css');
    } else {
        console.log('styles.css already has mobile additions.');
    }

    if (fs.existsSync(minCssFile)) {
        const currentMinCss = fs.readFileSync(minCssFile, 'utf8');
        if (!currentMinCss.includes('MOBILE OPTIMIZATION ENHANCEMENTS')) {
            // minify the addition slightly by removing newlines just to be clean
            const minAdd = add.replace(/\n/g, ' ').replace(/\s+/g, ' ');
            fs.appendFileSync(minCssFile, minAdd, 'utf8');
            console.log('Appended to styles.min.css');
        } else {
            console.log('styles.min.css already has mobile additions.');
        }
    }
}
