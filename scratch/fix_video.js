const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\backup-l[\\LP';
const projectsPath = path.join(rootDir, 'public', 'projects.js');

if (fs.existsSync(projectsPath)) {
    let content = fs.readFileSync(projectsPath, 'utf8');

    // Highly reliable Google Storage MP4 links
    const horizVideo = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    const vertVideo1 = "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";
    const vertVideo2 = "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4";
    const vertVideo3 = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4";

    content = content.replace(/reel:\s*'[^']+'/g, `reel: '${horizVideo}'`);
    content = content.replace(/reel1:\s*'[^']+'/g, `reel1: '${vertVideo1}'`);
    content = content.replace(/reel2:\s*'[^']+'/g, `reel2: '${vertVideo2}'`);
    content = content.replace(/reel3:\s*'[^']+'/g, `reel3: '${vertVideo3}'`);

    fs.writeFileSync(projectsPath, content, 'utf8');
    console.log('Updated projects.js with reliable video links.');
}

// Also update admin-seed.js if it exists
const adminSeedPath = path.join(rootDir, 'admin-seed.js');
if (fs.existsSync(adminSeedPath)) {
    let content = fs.readFileSync(adminSeedPath, 'utf8');

    const horizVideo = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    const vertVideo1 = "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";
    const vertVideo2 = "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4";
    const vertVideo3 = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4";

    content = content.replace(/reel:\s*'[^']+'/g, `reel: '${horizVideo}'`);
    content = content.replace(/reel1:\s*'[^']+'/g, `reel1: '${vertVideo1}'`);
    content = content.replace(/reel2:\s*'[^']+'/g, `reel2: '${vertVideo2}'`);
    content = content.replace(/reel3:\s*'[^']+'/g, `reel3: '${vertVideo3}'`);

    fs.writeFileSync(adminSeedPath, content, 'utf8');
    console.log('Updated admin-seed.js with reliable video links.');
}
