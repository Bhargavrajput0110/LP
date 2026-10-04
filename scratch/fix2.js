const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

code = code.replace("vid.play().catch(e => console.warn('Playback blocked:', e));", "vid.play().catch(e => { /* Playback blocked expected */ });");
code = code.replace("preloadedVid.play().catch(e => console.warn('Playback blocked:', e));", "preloadedVid.play().catch(e => { /* Playback blocked expected */ });");

fs.writeFileSync('main.js', code, 'utf8');
console.log('Video error swallow applied to main.js');
