/**
 * Deprecated: Legacy convert() method
 */
const fs = require('fs');
const path = require('path');
const WebPConverter = require('../index.js');

const outDir = path.join(__dirname, 'out');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const converter = new WebPConverter();
  const input = path.join(__dirname, 'images', 'static.webp');
  const output = path.join(outDir, 'deprecated-static.png');

  // This will print a deprecation warning
  const result = await converter.convert(input, output, { quality: 80 });
  console.log('Deprecated convert() result:', result);
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { run };
