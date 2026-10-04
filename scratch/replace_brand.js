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
          if (file.includes('node_modules') || file.includes('.git') || file.includes('scratch') || file.includes('.vercel')) {
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
        
        // Order matters: replace longer strings first
        content = content.replace(/Limitless Productions/g, 'YourBrand');
        content = content.replace(/LIMITLESS PRODUCTIONS/g, 'YOURBRAND');
        
        // Then individual words (case sensitive to preserve URLs like limitless-cms)
        content = content.replace(/Limitless/g, 'YourBrand');
        content = content.replace(/LIMITLESS/g, 'YOURBRAND');
        
        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log('Updated', file.replace(rootDir, ''));
            count++;
        }
    }
  });
  console.log(`\nUpdated ${count} files total.`);
});
