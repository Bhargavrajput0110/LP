const path = require('path');
const fs = require('fs');
const dir = path.resolve('d:/backup-l[/LP');
const addFile = path.join(dir, 'scratch', 'mobile_additions.css');
const cssFile = path.join(dir, 'styles.css');

const add = fs.readFileSync(addFile, 'utf8');
fs.appendFileSync(cssFile, '\n' + add, 'utf8');
const lines = fs.readFileSync(cssFile, 'utf8').split('\n').length;
console.log('Done. styles.css now has', lines, 'lines');
