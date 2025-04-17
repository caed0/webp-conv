# webp-conv - WebP to GIF/PNG Converter

[![License#: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) ![GitHub commit activity](https://img.shields.io/github/commit-activity/y/caed0/webp-conv) ![GitHub top language](https://img.shields.io/github/languages/top/caed0/webp-conv) ![GitHub branch status](https://img.shields.io/github/checks-status/caed0/webp-conv/master) ![GitHub repo size](https://img.shields.io/github/repo-size/caed0/webp-conv) ![GitHub forks](https://img.shields.io/github/forks/caed0/webp-conv) ![GitHub package.json version](https://img.shields.io/github/package-json/v/caed0/webp-conv) ![GitHub Release](https://img.shields.io/github/v/release/caed0/webp-conv)

webp-conv is a Node.js module for converting both animated and static WebP files to GIF or PNG formats. This tool leverages the powerful libwebp library to provide high-quality conversions, making it a convenient solution for your image conversion needs.

## Installation

Install webp-conv using npm:

```bash
npm install @caed0/webp-conv
```

## Installation Verification

After installation, verify if everything is set up correctly by running:

```bash
npm test
```

This command will run the test script that checks if the required libwebp binaries were downloaded and installed correctly.

## Usage

Here's a simple example of how to use webp-conv in your Node.js project:

```javascript
const Converter = require('@caed0/webp-conv');
const converter = new Converter();

async function convertImage() {
    try {
        const input = 'input.webp';
        const output = 'output.gif';
        const options = {
            quality: 10,
            transparent: '0x000000'
        };

        await converter.convert(input, output, options);
        console.log('Conversion completed successfully!');
    } catch (error) {
        console.error('Error during conversion:', error.message);
    }
}

convertImage();
```

## Parameters

The `convert` method accepts the following parameters:

- `input`: The path to the WebP file you want to convert.
- `output`: The path where the converted file will be saved.
- `options` (optional): An object containing additional options for conversion (only applies to GIF output).
  - `quality`: The output image quality (0-100). Higher values result in better quality but larger files. (`Default: 10`)
  - `transparent`: A string specifying the transparency color in hexadecimal format (e.g., '0xRRGGBB' or '0xRRGGBBAA'). This option is only applicable for conversions with transparent background. (`Default: 0x000000`)

## Complete Example

A more detailed example is available in the `examples` directory. To run the example:

```bash
npm run conv
```

## Dependencies

This module relies on the [libwebp](https://developers.google.com/speed/webp) library for WebP image processing. The libwebp precompiled binaries are automatically downloaded during installation.

## Future Updates

We are planning to add the following features:

- WebP to video format conversion (MP4, WebM)
- Reverse conversion (GIF/PNG to WebP)
- Batch processing support
- Command-line interface (CLI)
- Performance optimization for large files
- Support for more output formats
- API for image manipulation during conversion

## Development

To contribute to development:

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run tests:

```bash
npm test
```

4. Test your changes with the example:

```bash
npm run conv
```

## License

This project is licensed under the MIT License - see the [LICENSE](https://en.wikipedia.org/wiki/MIT_License) file for details.

The libwebp library has a separate license. For more information, please refer to the [libwebp license](https://github.com/webmproject/libwebp/blob/main/COPYING).

## Issues and Contributions

If you encounter any issues or have suggestions for improvements, please feel free to create an issue on the [GitHub repository](https://github.com/caed0/webp-conv/issues). Contributions in the form of pull requests are also welcome.

## Acknowledgments

- WebM Project team for developing libwebp
- All project contributors and maintainers
