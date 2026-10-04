const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\backup-l[\\LP';

// 1. Fix projects.js videos
const projectsPath = path.join(rootDir, 'public', 'projects.js');
let projContent = fs.readFileSync(projectsPath, 'utf8');

const horizVideo = "https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164";
const vertVideo1 = "https://player.vimeo.com/external/530722896.sd.mp4?s=b5f7e7104b2a3d75c0268ec3b2a24cfa88ebbd8e&profile_id=165";
const vertVideo2 = "https://player.vimeo.com/external/511100913.sd.mp4?s=12d19213f50225cd8aeb1d74ea487ff6bc477207&profile_id=165";
const vertVideo3 = "https://player.vimeo.com/external/416035975.sd.mp4?s=a712cc6b840e6c52a3ee5d92df95804cb7b949ba&profile_id=165";

// Replace reel: '...' with horizontal, and reel1/2/3 with vertical
projContent = projContent.replace(/reel:\s*'[^']+'/g, `reel: '${horizVideo}'`);
projContent = projContent.replace(/reel1:\s*'[^']+'/g, `reel1: '${vertVideo1}'`);
projContent = projContent.replace(/reel2:\s*'[^']+'/g, `reel2: '${vertVideo2}'`);
projContent = projContent.replace(/reel3:\s*'[^']+'/g, `reel3: '${vertVideo3}'`);

fs.writeFileSync(projectsPath, projContent, 'utf8');
console.log('Fixed projects.js videos.');


// 2. Remove limitless logo and add phone number in index.html
const indexPath = path.join(rootDir, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// The logo might be an img tag inside <a class="logo"
// Let's replace the whole <img src="public/images/logo.png"...> with a text logo
indexContent = indexContent.replace(/<img[^>]*src="public\/images\/logo\.png"[^>]*>/g, '<span style="font-size: 24px; font-weight: bold; color: white; font-family: \'Bebas Neue\', sans-serif; letter-spacing: 2px;">YB</span>');

// Replace old phone numbers if they exist
indexContent = indexContent.replace(/\+91\s*[0-9\s-]{10,}/g, '7575849772');
indexContent = indexContent.replace(/(href="tel:)[^"]+(")/g, '$17575849772$2');

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('Fixed index.html logo and phone numbers.');


// 3. Add/Change phone number in contact-overlay.html
const contactPath = path.join(rootDir, 'public', 'fragments', 'contact-overlay.html');
if (fs.existsSync(contactPath)) {
    let contactContent = fs.readFileSync(contactPath, 'utf8');
    
    // Check if phone number is already there
    if (!contactContent.includes('7575849772')) {
        const phoneHtml = `
                <div class="method flex flex-col">
                    <span class="font-counter text-[9px] tracking-[0.2em] text-white/30 uppercase mb-2">Phone</span>
                    <a href="tel:7575849772" class="font-editorial text-2xl text-white hover:text-[var(--scene-accent)] transition-colors">7575849772</a>
                </div>`;
        
        // Insert after Email method
        contactContent = contactContent.replace(/(<span class="font-soft text-xl text-white">Vadodara, India \/ Remote<\/span>\s*<\/div>)/, '$1\n' + phoneHtml);
        fs.writeFileSync(contactPath, contactContent, 'utf8');
        console.log('Added phone number to contact-overlay.html.');
    } else {
        console.log('Phone number already in contact-overlay.html.');
    }
}

// 4. Update admin.js to replace logo if necessary
const adminPath = path.join(rootDir, 'admin.js');
let adminContent = fs.readFileSync(adminPath, 'utf8');
adminContent = adminContent.replace(/<img[^>]*src="public\/images\/logo\.png"[^>]*>/g, '<span style="font-size: 24px; font-weight: bold; color: white; font-family: \'Bebas Neue\', sans-serif;">YB</span>');
fs.writeFileSync(adminPath, adminContent, 'utf8');

console.log('Done.');
