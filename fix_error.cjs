const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/ProductScanner.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\s*console\.log\('Processing files:', validFiles\.length\);/,
  ''
);

fs.writeFileSync(file, content);
