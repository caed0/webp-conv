/**
 * Batch: Multiple jobs with per-job overrides
 */
const fs = require('fs');
const path = require('path');
const WebPConverter = require('../index.js');

const outDir = path.join(__dirname, 'out');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const converter = new WebPConverter({ quality: 60 }); // defaults
  const jobs = [
    {
      input: path.join(__dirname, 'images', 'animated.webp'),
      output: path.join(outDir, 'animated.gif'),
      settings: { quality: 90 }
    },
    {
      input: path.join(__dirname, 'images', 'static.webp'),
      output: path.join(outDir, 'static.png')
    }
  ];

  const results = await converter.convertJobs(jobs);
  console.log('Batch results:', results);
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { run };
