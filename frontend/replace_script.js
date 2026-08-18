const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        let content = fs.readFileSync(file, 'utf8');
        let modified = content
          .replace(/>Department</g, '>Business Unit<')
          .replace(/>Departments</g, '>Business Units<')
          .replace(/\"Department\"/g, '\"Business Unit\"')
          .replace(/\"Departments\"/g, '\"Business Units\"')
          .replace(/label=\"Department\"/g, 'label=\"Business Unit\"')
          .replace(/label=\"Departments\"/g, 'label=\"Business Units\"')
          .replace(/placeholder=\"Select Department/g, 'placeholder=\"Select Business Unit')
          .replace(/Department Admin/g, 'Business Unit Admin')
          .replace(/Department /g, 'Business Unit ')
          .replace(/ Departments/g, ' Business Units');
        
        if (modified !== content) {
          fs.writeFileSync(file, modified);
          console.log('Updated:', file);
        }
      }
    }
  });
  return results;
}

walk('.');
