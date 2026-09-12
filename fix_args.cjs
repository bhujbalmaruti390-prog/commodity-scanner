const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/ProductScanner.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const validation = await validateProductImage\(primaryImage, allImages, hint, text\);/,
  'const validation = await validateProductImage(primaryImage, hint, text);'
);

fs.writeFileSync(file, content);
