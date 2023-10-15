const webpconv = require('../index.js');
const converter = new webpconv();

const inputFiles = [
    'images/animated.webp',
    'images/animated-transparent.webp',
    'images/static.webp'
];
const outputFolder = 'images/output';

inputFiles.forEach(input => {
    converter.convert(input, outputFolder, { quality: 15, transparent: '0x000000' }).then(output => {
        console.log(`converted: ${input} => ${output}`);
    });
});

// This will convert all animated/static WebP files in exaples/images to GIF/PNG format and output the files in examples/images folder.