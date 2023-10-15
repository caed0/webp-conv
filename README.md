# webp-conv - WebP to GIF/PNG Converter

webp-conv is a Node.js module for converting both animated and static WebP files to GIF or PNG format. With this tool, you can easily batch convert your WebP images, making it a convenient solution for your image conversion needs.

## Installation

You can install webp-conv using npm:

```bash
npm install @caed0/webp-conv
```

## Usage

Here's a simple example of how to use webp-conv in your Node.js project:

```javascript
const webpconv = require('@caed0/webp-conv');
const converter = new webpconv();

const input = 'example.webp';
const outputFolder = 'output';

converter.convert(input, outputFolder, { quality: 10, transparent: '0x000000' });
```

This code snippet demonstrates how to convert a list of input WebP files to GIF or PNG format, specifying output quality and transparency settings. The converted files will be saved in the specified output folder.

## Parameters

The `convert` method takes the following parameters:

- `input`: The path to the input WebP file you want to convert.
- `outputFolder`: The folder where the converted file will be saved.
- `options` (optional): An object containing additional options for the conversion.
    - `quality`: The quality of the output image (0-100). Higher values result in better quality, but larger file sizes. (`Default: 10`)
    - `transparent`: A string specifying the transparency color in hexadecimal format (e.g., '0xRRGGBB' or '0xRRGGBBAA'). This option is only applicable to PNG format conversions. (`Default: 0x000000`)

## License

This project is licensed under the MIT License - see the [LICENSE](https://en.wikipedia.org/wiki/MIT_License) file for details.

## Issues and Contributions

If you encounter any issues or have suggestions for improvements, please feel free to create an issue on the [GitHub repository](https://github.com/caed0/webp-conv). Contributions in the form of pull requests are also welcome.

Enjoy using webp-conv for your WebP to GIF/PNG conversion needs!
