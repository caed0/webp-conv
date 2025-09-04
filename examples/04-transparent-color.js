/**
 * Transparent color: Control GIF transparency color
 */
const fs = require('fs');
const path = require('path');
const WebPConverter = require('../index.js');

const outDir = path.join(__dirname, 'out');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const converter = new WebPConverter();
  const input = path.join(__dirname, 'images', 'animated-transparent.webp');

  const results = await converter.convertJobs([
    {
      input,
      output: path.join(outDir, 'transparent-default.gif')
    },
    {
      input,
      output: path.join(outDir, 'transparent-white.gif'),
      settings: { transparent: '0xFFFFFF' }
    },
    {
      input,
      output: path.join(outDir, 'transparent-green.gif'),
      settings: { transparent: '0x00FF00' }
    }
  ]);

  console.log('Transparent color results:', results);
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { run };
