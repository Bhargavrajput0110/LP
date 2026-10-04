const fs = require('fs');
let js = fs.readFileSync('d:/backup-l[/LP/main.js', 'utf8');
js = js.replace(/gsap\.to\('\.pr-close, \.pr-cursor-pill, \.pr-nav-btn'/g, "gsap.to('.pr-close, .pr-nav-btn'");
js = js.replace(/gsap\.killTweensOf\('\.pr-cursor-pill'\);/g, '');
js = js.replace(/const pill = document\.querySelector\('\.pr-cursor-pill'\);/g, 'const pill = null;');
js = js.replace(/const revealPill = document\.querySelector\('\.pr-cursor-pill'\);/g, 'const revealPill = null;');
fs.writeFileSync('d:/backup-l[/LP/main.js', js, 'utf8');
console.log('done');
