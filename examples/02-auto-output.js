/**
 * Auto output: No output path provided, format inferred
 */
const WebPConverter = require('../index.js');
const path = require('path');

async function run() {
  const converter = new WebPConverter({ quality: 80 });
  const animated = path.join(__dirname, 'images', 'animated.webp');
  const statik = path.join(__dirname, 'images', 'static.webp');

  const results = await converter.convertJobs([
    { input: animated }, // -> .gif next to input
    { input: statik }    // -> .png next to input
  ]);

  console.log('Auto output results:', results);
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { run };
