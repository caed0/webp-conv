# webp-conv - WebP to GIF/PNG Converter 
[![NPM Version](https://img.shields.io/npm/v/%40caed0%2Fwebp-conv?style=for-the-badge)](https://www.npmjs.com/package/@caed0/webp-conv)
[![NPM Downloads](https://img.shields.io/npm/d18m/%40caed0%2Fwebp-conv?style=for-the-badge)](https://www.npmjs.com/package/@caed0/webp-conv)
[![License](https://img.shields.io/npm/l/%40caed0%2Fwebp-conv?style=for-the-badge)](LICENSE)

webp-conv is a Node.js module for converting both animated and static WebP files to GIF or PNG format. This tool leverages the powerful libwebp library to provide high-quality conversions. With this tool, you can easily convert your WebP images using flexible job-based configuration, making it a convenient solution for your image conversion needs.

## 🚨 Important Notice

> **DEPRECATION WARNING**: The `convert()` method is deprecated and will be removed in a future major version. Please migrate to the new `convertJobs()` method which offers better functionality, error handling, and job-based processing capabilities.

## Installation

You can install webp-conv using npm:

```bash
npm install @caed0/webp-conv
```

## Usage

### Job-Based Conversion (Recommended)

> ✅ **RECOMMENDED**: Use the job-based approach with `convertJobs()` for the best experience and functionality.

The job-based approach allows you to process multiple conversions with individual settings:

```javascript
const webpconv = require('@caed0/webp-conv');
const converter = new webpconv({ quality: 80, transparent: '0x000000' }); // Default settings

// Single job
const singleJob = {
    input: 'input.webp',
    output: 'output.gif', // Optional - auto-generated if not provided
    settings: { quality: 100, transparent: '0xFFFFFF' } // Optional - overrides defaults
};

const result = await converter.convertJobs(singleJob);

// Multiple jobs
const jobs = [
    {
        input: 'animated.webp',
        output: 'animated.gif',
        settings: { quality: 90 }
    },
    {
        input: 'static.webp',
        // output auto-generated as 'static.png'
        settings: { quality: 95 }
    },
    {
        input: 'transparent.webp',
        output: 'transparent.gif',
        settings: { quality: 85, transparent: '0x00FF00' }
    }
];

const results = await converter.convertJobs(jobs);
```

### Traditional Method (DEPRECATED - Backward Compatible)

> ⚠️ **DEPRECATED**: The `convert()` method is deprecated and will be removed in a future version. Please use the job-based `convertJobs()` method instead for better functionality and more flexible processing.

The original method is still supported for backward compatibility:

```javascript
const webpconv = require('@caed0/webp-conv');
const converter = new webpconv();

const input = 'input.webp';
const output = 'output.gif';

await converter.convert(input, output, { quality: 10, transparent: '0x000000' });
```

## Job Object Structure

Each job object can have the following properties:

- `input` (required): The path to the input WebP file you want to convert.
- `output` (optional): The path where the converted file will be saved. If not provided, it will be auto-generated based on the input filename and detected format (animated WebP → .gif, static WebP → .png).
- `settings` (optional): An object containing conversion options that override the converter's default settings for this specific job.

## Constructor Options

You can set default options when creating a converter instance:

```javascript
const converter = new webpconv({
    quality: 85,
    transparent: '0xFFFFFF'
});
```

These defaults will be used for all conversions unless overridden by individual job settings.

## Parameters

### convertJobs Method

The `convertJobs` method takes the following parameter:

- `jobs`: A single job object or an array of job objects

### convert Method (DEPRECATED - Legacy)

> ⚠️ **DEPRECATED**: This method is deprecated. Use `convertJobs()` instead.

The `convert` method takes the following parameters:

- `input`: The path to the input WebP file you want to convert.
- `output`: The path where the converted file will be saved.
- `options` (optional): An object containing additional options for the conversion (only apply if the output is an gif).

### Settings/Options Object

Both methods support the following settings (only apply to GIF output):

- `quality`: The quality of the output image (0-100). Higher values result in better quality, but larger file sizes. (`Default: 10`)
- `transparent`: A string specifying the transparency color in hexadecimal format (e.g., '0xRRGGBB' or '0xRRGGBBAA'). This option is only applicable to conversions with transparent background. (`Default: 0x000000`)

## Examples

Check out the examples folder for more detailed usage examples:

- `examples/convert.js` - Shows both old and new methods
- `examples/convert-jobs.js` - Comprehensive job-based examples

## Migration Guide

### From convert() to convertJobs()

If you're currently using the deprecated `convert()` method, here's how to migrate:

**Old way (deprecated):**
```javascript
const converter = new webpconv();
await converter.convert('input.webp', 'output.gif', { quality: 80 });
```

**New way (recommended):**
```javascript
const converter = new webpconv();
await converter.convertJobs({
    input: 'input.webp',
    output: 'output.gif',
    settings: { quality: 80 }
});
```

**Benefits of migrating:**
- ✅ Better error handling and validation
- ✅ Batch processing capabilities
- ✅ Auto-generated output paths
- ✅ Per-job settings override
- ✅ Future-proof (no deprecation warnings)

## Dependencies

This module relies on the [libwebp](https://developers.google.com/speed/webp) library for WebP image processing. Precompiled binaries of libwebp are automatically downloaded during installation.

## License

This project is licensed under the GPL-3.0-or-later License - see the LICENSE file for details.

The libwebp library is licensed under a separate license. For more information, please refer to the [libwebp license](https://github.com/webmproject/libwebp/blob/main/COPYING).

## Issues and Contributions

If you encounter any issues or have suggestions for improvements, please feel free to create an issue on the [GitHub repository](https://github.com/caed0/webp-conv/issues). Contributions in the form of pull requests are also welcome.
