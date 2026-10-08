const fs = require('fs');
const path = require('path');
function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js') || p.endsWith('.jsx')) {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('\\n')) { // search for literal backslash n
        c = c.split('\\n').join('\n');
        fs.writeFileSync(p, c);
      }
    }
  });
}
walk('./src');
