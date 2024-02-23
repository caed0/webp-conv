const webpconv = require('../index.js');
const converter = new webpconv();

const input = './images/test.webp';
const output = './images/output/test_c.gif';

converter.convert(input, output, { quality: 15, transparent: '0x000000' }).then(output => {
    console.log(`converted: ${input} => ${output}`);
});
