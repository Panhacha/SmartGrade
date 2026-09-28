const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace literal string 'http://localhost:3000/...' with \`\${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/...\`
      // We look for 'http://localhost:3000', `http://localhost:3000`, "http://localhost:3000"
      
      // For string concatenations: 'http://localhost:3000/...'
      content = content.replace(/'http:\/\/localhost:3000([^']*)'/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}$1`");
      content = content.replace(/"http:\/\/localhost:3000([^"]*)"/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}$1`");
      content = content.replace(/`http:\/\/localhost:3000([^`]*)`/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}$1`");

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

replaceInDir(path.join(__dirname, 'frontend', 'src'));
console.log('URLs updated!');
