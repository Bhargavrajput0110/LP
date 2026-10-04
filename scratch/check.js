const path = require('path');
const fs = require('fs');

const adminJs = fs.readFileSync(path.resolve('d:/backup-l[/LP/admin.js'), 'utf8');
const adminHtml = fs.readFileSync(path.resolve('d:/backup-l[/LP/admin.html'), 'utf8');

console.log('=== admin.js checks ===');
console.log('quickRemoveCatFromProject:', adminJs.includes('quickRemoveCatFromProject'));
console.log('quickAddProjectToCat:', adminJs.includes('quickAddProjectToCat'));
console.log('Assigned clients panel:', adminJs.includes('Assigned clients panel'));
console.log('cat-badge-x button in projectRow:', adminJs.includes('cat-badge-x'));
console.log('assigned = state.projects.filter:', adminJs.includes('assigned = state.projects.filter'));
console.log('client card(s) assigned:', adminJs.includes('client card'));
console.log('Add client card… dropdown:', adminJs.includes('Add client card'));
console.log('\n=== admin.html checks ===');
console.log('.cat-chip-x CSS:', adminHtml.includes('.cat-chip-x'));
console.log('.cat-badge-x CSS:', adminHtml.includes('.cat-badge-x'));
console.log('.cat-row flex-direction:column:', adminHtml.includes('flex-direction: column') || adminHtml.includes('flex-direction:column'));
