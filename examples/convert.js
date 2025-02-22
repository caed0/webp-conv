const webpconv = require('../index.js');
const converter = new webpconv();

const input = [
    'examples/images/animated.webp',
    'examples/images/animated-transparent.webp',
    'examples/images/static.webp'
];

const output = [
    'examples/images/output/animated.gif',
    'examples/images/output/animated-transparent.gif',
    'examples/images/output/static.png'
];

for (const i in input) {
    converter.convert(input[i], output[i], { quality: 100, transparent: '0x000000' }).then(output => {
        console.log(`converted: ${input[i]} => ${output}`);
    });
}