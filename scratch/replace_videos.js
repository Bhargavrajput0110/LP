const fs = require('fs');
const path = require('path');

const horizVideos = [
    "https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164",
    "https://player.vimeo.com/external/494252666.sd.mp4?s=25e36ff5c13e56aebc2826a6c4b2c15982e0fb5f&profile_id=164",
    "https://player.vimeo.com/external/403616003.sd.mp4?s=d4529edbdcb1e07b7194639c09c13b30e8c89de5&profile_id=164"
];

const vertVideos = [
    "https://player.vimeo.com/external/530722896.sd.mp4?s=b5f7e7104b2a3d75c0268ec3b2a24cfa88ebbd8e&profile_id=165",
    "https://player.vimeo.com/external/511100913.sd.mp4?s=12d19213f50225cd8aeb1d74ea487ff6bc477207&profile_id=165",
    "https://player.vimeo.com/external/416035975.sd.mp4?s=a712cc6b840e6c52a3ee5d92df95804cb7b949ba&profile_id=165"
];

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
  
  let hIndex = 0;
  let vIndex = 0;

  results.forEach(file => {
    if (file.match(/\.(html|js|css|json)$/)) {
        if(file.includes('package-lock.json')) return;
        
        let originalContent = fs.readFileSync(file, 'utf8');
        let content = originalContent;
        
        // Find all cloudinary mp4/webm links
        const videoRegex = /https:\/\/res\.cloudinary\.com\/[^'"\s]+\.(mp4|webm)/gi;
        
        content = content.replace(videoRegex, (match) => {
            // Determine if horizontal or vertical based on URL text
            const isHorizontal = match.toLowerCase().includes('horizontal') || match.includes('w_1280');
            
            if (isHorizontal) {
                const vid = horizVideos[hIndex % horizVideos.length];
                hIndex++;
                return vid;
            } else {
                const vid = vertVideos[vIndex % vertVideos.length];
                vIndex++;
                return vid;
            }
        });
        
        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log('Replaced videos in', file.replace(rootDir, ''));
            count++;
        }
    }
  });
  console.log(`\nUpdated ${count} files total.`);
});
