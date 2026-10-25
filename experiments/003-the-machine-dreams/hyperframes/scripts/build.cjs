const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'src/index.template.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'src/film.js'), 'utf8');
fs.writeFileSync(path.join(root, 'index.html'), shell.replace('/* FILM_SOURCE */', () => source));
console.log('Built index.html from editable source.');
