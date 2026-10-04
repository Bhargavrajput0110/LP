const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          // Ignore specific directories
          if (file.includes('node_modules') || file.includes('.git') || file.includes('scratch') || file.includes('.vercel') || file.includes('.kilo')) {
             next();
          } else {
            walk(file, (err, res) => {
              results = results.concat(res);
              next();
            });
          }
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

const rootDir = 'd:\\backup-l[\\LP';

walk(rootDir, (err, results) => {
  if (err) throw err;
  let count = 0;
  results.forEach(file => {
    if (file.match(/\.(html|js|css|json|webmanifest|txt)$/)) {
        // Skip lock files
        if(file.includes('package-lock.json') || file.includes('vercel_ls.txt')) return;
        
        let originalContent = fs.readFileSync(file, 'utf8');
        let content = originalContent;
        
        // Brand name replacements
        content = content.replace(/Limitless Productions/gi, 'YourBrand');
        content = content.replace(/LimitlessProductions/gi, 'YourBrand');
        content = content.replace(/limitless_productions__/g, 'your_brand__');
        content = content.replace(/limitlessproductions/gi, 'yourbrand');
        
        // Individual words
        content = content.replace(/LIMITLESS/g, 'YOURBRAND');
        content = content.replace(/Limitless/g, 'YourBrand');
        content = content.replace(/limitless/g, 'yourbrand');
        
        // Specific LP Acronym Replacements
        content = content.replace(/\[LP\]/g, '[YB]');
        content = content.replace(/LP Dev Server/g, 'YB Dev Server');
        content = content.replace(/>LP</g, '>YB<');
        content = content.replace(/>LP\s*-/g, '>YB -');
        content = content.replace(/<span>LP<\/span>/g, '<span>YB</span>');
        
        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log('Updated', file.replace(rootDir, ''));
            count++;
        }
    }
  });
  console.log(`\nUpdated ${count} files total.`);
});
