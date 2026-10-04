const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\backup-l[\\LP';

// 1. Fix videos with reliable Cloudinary Demo MP4s
const projectsPath = path.join(rootDir, 'public', 'projects.js');
if (fs.existsSync(projectsPath)) {
    let content = fs.readFileSync(projectsPath, 'utf8');

    const horizVideo = "https://res.cloudinary.com/demo/video/upload/dog.mp4";
    const vertVideo1 = "https://res.cloudinary.com/demo/video/upload/elephants.mp4";
    const vertVideo2 = "https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4";
    const vertVideo3 = "https://res.cloudinary.com/demo/video/upload/ski_jump.mp4";

    content = content.replace(/reel:\s*'[^']+'/g, `reel: '${horizVideo}'`);
    content = content.replace(/reel1:\s*'[^']+'/g, `reel1: '${vertVideo1}'`);
    content = content.replace(/reel2:\s*'[^']+'/g, `reel2: '${vertVideo2}'`);
    content = content.replace(/reel3:\s*'[^']+'/g, `reel3: '${vertVideo3}'`);

    fs.writeFileSync(projectsPath, content, 'utf8');
    console.log('Fixed videos in projects.js');
}

const adminSeedPath = path.join(rootDir, 'admin-seed.js');
if (fs.existsSync(adminSeedPath)) {
    let content = fs.readFileSync(adminSeedPath, 'utf8');
    const horizVideo = "https://res.cloudinary.com/demo/video/upload/dog.mp4";
    const vertVideo1 = "https://res.cloudinary.com/demo/video/upload/elephants.mp4";
    const vertVideo2 = "https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4";
    const vertVideo3 = "https://res.cloudinary.com/demo/video/upload/ski_jump.mp4";

    content = content.replace(/reel:\s*'[^']+'/g, `reel: '${horizVideo}'`);
    content = content.replace(/reel1:\s*'[^']+'/g, `reel1: '${vertVideo1}'`);
    content = content.replace(/reel2:\s*'[^']+'/g, `reel2: '${vertVideo2}'`);
    content = content.replace(/reel3:\s*'[^']+'/g, `reel3: '${vertVideo3}'`);

    fs.writeFileSync(adminSeedPath, content, 'utf8');
    console.log('Fixed videos in admin-seed.js');
}

// 2. Change address and Insta in index.html
const indexPath = path.join(rootDir, 'index.html');
if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Address (if in index)
    content = content.replace(/Vadodara, India \/ Remote/gi, 'GSFC College');
    content = content.replace(/Vadodara/gi, 'GSFC College');
    
    // Insta
    content = content.replace(/href="https:\/\/instagram\.com\/[^"]+"/gi, 'href="https://instagram.com/brixon.in"');
    content = content.replace(/>@client_handle</gi, '>@brixon.in<');
    content = content.replace(/@your_brand__/gi, '@brixon.in');
    content = content.replace(/your_brand__/gi, 'brixon.in');

    fs.writeFileSync(indexPath, content, 'utf8');
    console.log('Fixed index.html address and insta.');
}

// 3. Change address in contact-overlay.html
const contactPath = path.join(rootDir, 'public', 'fragments', 'contact-overlay.html');
if (fs.existsSync(contactPath)) {
    let content = fs.readFileSync(contactPath, 'utf8');
    content = content.replace(/Vadodara, India \/ Remote/gi, 'GSFC College');
    content = content.replace(/Vadodara/gi, 'GSFC College');
    fs.writeFileSync(contactPath, content, 'utf8');
    console.log('Fixed contact-overlay.html address.');
}

console.log('All fixes applied successfully.');
