// Simple aggregator: runs the focused example scripts
const { run: basic } = require('./01-basic-single');
const { run: auto } = require('./02-auto-output');
const { run: batch } = require('./03-batch-jobs');
const { run: transparent } = require('./04-transparent-color');

async function runExamples() {
    console.log('Running examples...');
    await basic();
    await auto();
    await batch();
    await transparent();
    console.log('Done. See outputs in examples/out and alongside inputs.');
}

if (require.main === module) {
    runExamples().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { runExamples };
