# webp-conv - High-Performance WebP to GIF/PNG Converter

[![License#: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) ![GitHub commit activity](https://img.shields.io/github/commit-activity/y/caed0/webp-conv) ![GitHub top language](https://img.shields.io/github/languages/top/caed0/webp-conv) ![GitHub branch status](https://img.shields.io/github/checks-status/caed0/webp-conv/master) ![GitHub repo size](https://img.shields.io/github/repo-size/caed0/webp-conv) ![GitHub forks](https://img.shields.io/github/forks/caed0/webp-conv) ![GitHub package.json version](https://img.shields.io/github/package-json/v/caed0/webp-conv) ![GitHub Release](https://img.shields.io/github/v/release/caed0/webp-conv)

**webp-conv** is a robust Node.js module designed for efficient conversion of both animated and static WebP images into GIF or PNG formats. By leveraging the power and speed of the native libwebp library, this module ensures high-quality, reliable conversions suitable for various applications.

## Key Features

- **Versatile Conversion:** Handles both static and animated WebP files.
- **Multiple Output Formats:** Convert WebP to animated GIF or static PNG.
- **High Performance:** Utilizes pre-compiled `libwebp` binaries for optimal speed.
- **Configurable Quality:** Fine-tune GIF output quality and transparency settings.
- **Simple Async API:** Easy-to-use Promise-based API for modern JavaScript workflows.
- **Cross-Platform:** Pre-compiled binaries provided for major operating systems (Windows, macOS, Linux).

## Installation

Install the module using npm or yarn:

```bash
npm install @caed0/webp-conv

# or

yarn add @caed0/webp-conv
```

Upon installation, the necessary `libwebp` binaries for your platform will be automatically downloaded.

## Installation Verification

To ensure the module and its native dependencies (`libwebp` binaries) are correctly installed and accessible, run the test script:

```bash
npm test
```

This command executes a basic check to confirm the presence and executability of the required conversion tools. Passing this test indicates that `webp-conv` is ready for use.

## Usage

Integrating `webp-conv` into your project is straightforward.

### Basic Conversion (WebP to PNG)

For static WebP images, converting to PNG is often desired.

```javascript
const Converter = require('@caed0/webp-conv');
const path = require('path');

// Instantiate the converter
const converter = new Converter();

async function convertStaticWebP() {
const inputPath = path.join(**dirname, 'images', 'input-static.webp');
const outputPath = path.join(**dirname, 'output', 'output-image.png');

    console.log(`Attempting to convert ${inputPath} to ${outputPath}...`);

    try {
        await converter.convert(inputPath, outputPath);
        console.log(`✅ Static WebP converted successfully to ${outputPath}`);
    } catch (error) {
        console.error('❌ Error during static WebP conversion:', error.message);
        // Consider more specific error handling based on error type or message
        if (error.message.includes('Cannot open input file')) {
            console.error('Suggestion: Check if the input file exists and permissions are correct.');
        }
    }

}

convertStaticWebP();
```

### Animated WebP to GIF with Options

For animated WebP files, conversion to GIF is common. You can specify options like quality and transparency color.

```javascript
const Converter = require('@caed0/webp-conv');
const path = require('path');

const converter = new Converter();

async function convertAnimatedWebP() {
const inputPath = path.join(**dirname, 'images', 'input-animated.webp');
const outputPath = path.join(**dirname, 'output', 'output-animation.gif');

    // Conversion options specifically for GIF output
    const options = {
        quality: 75, // 0-100, higher is better quality, larger file size (Default: 10)
        transparent: '0x00FF00' // Set green (00FF00) as the transparent color
                                // Format: '0xRRGGBB' or '0xRRGGBBAA' (Default: 0x000000)
    };

    console.log(`Attempting to convert ${inputPath} to ${outputPath} with options...`);

    try {
        await converter.convert(inputPath, outputPath, options);
        console.log(`✅ Animated WebP converted successfully to ${outputPath} with quality ${options.quality}`);
    } catch (error) {
        console.error('❌ Error during animated WebP conversion:', error.message);
        // Example: Log stack trace for debugging complex issues
        // console.error(error.stack);
    }

}

convertAnimatedWebP();
```

### Determining Output Format Dynamically

You might want to decide the output format based on some condition.

```javascript
const Converter = require('@caed0/webp-conv');
const path = require('path');
const fs = require('fs').promises; // Using promises API for async file operations

const converter = new Converter();

async function convertBasedOnType(inputPath, outputDir, preferGif = true) {
const baseName = path.basename(inputPath, '.webp');
const outputFormat = preferGif ? 'gif' : 'png';
const outputPath = path.join(outputDir, `${baseName}.${outputFormat}`);

    // Ensure output directory exists
    try {
        await fs.mkdir(outputDir, { recursive: true });
    } catch (dirError) {
        console.error(`❌ Failed to create output directory ${outputDir}:`, dirError.message);
        return; // Stop if we can't create the output directory
    }

    console.log(`Converting ${inputPath} to ${outputPath}...`);

    const options = outputFormat === 'gif' ? { quality: 50 } : {}; // Only apply options if output is GIF

    try {
        await converter.convert(inputPath, outputPath, options);
        console.log(`✅ Conversion successful: ${outputPath}`);
    } catch (error) {
        console.error(`❌ Error converting ${inputPath}:`, error.message);
    }

}

// Example usage:
const inputFile = path.join(**dirname, 'images', 'some-image.webp');
const outputDirectory = path.join(**dirname, 'output', 'dynamic');

convertBasedOnType(inputFile, outputDirectory, true); // Convert to GIF if possible
// convertBasedOnType(inputFile, outputDirectory, false); // Convert to PNG
```

## API Reference

### `Converter` Class

The main class used for conversions.

#### `new Converter()`

Creates a new instance of the converter.

### `converter.convert(input, output, [options])`

Asynchronously converts a WebP file to GIF or PNG.

- **`input`** (String): Absolute or relative path to the input WebP file.
- **`output`** (String): Absolute or relative path for the output file. The file extension (`.gif` or `.png`) determines the output format.
- **`options`** (Object, Optional): An object containing conversion options. **These options currently only apply when the output format is GIF.**

  - **`quality`** (Number): Specifies the compression quality for GIF output. Ranges from `0` to `100`. Higher values generally result in better visual quality but larger file sizes.
    - _Default:_ `10`
  - **`transparent`** (String): Defines the color to be treated as transparent in the output GIF. The format should be a hexadecimal string: `'0xRRGGBB'` (e.g., `'0xFF0000'` for red) or `'0xRRGGBBAA'` (including alpha). This is useful for WebP images with alpha channels when converting to GIF, which has limited transparency support.
    - _Default:_ `'0x000000'` (black)

- **Returns:** (Promise<void>): A Promise that resolves when the conversion is complete or rejects if an error occurs.

- **Throws:** An `Error` if the input file doesn't exist, `libwebp` binaries fail, or the conversion process encounters an issue. The error message often provides details from the underlying `libwebp` tool.

## Running the Included Example

A practical example demonstrating usage is located in the `examples` directory. You can run it directly after installation:

```bash

# This command typically executes the script defined in package.json's "scripts.conv"

npm run conv
```

This is a great way to see the converter in action and test its functionality in your environment.

## Dependencies

- **libwebp:** The core Google library for WebP encoding and decoding. This module relies on pre-compiled command-line tools (`gif2webp`, `webpmux`) provided by the `libwebp` project. These binaries are downloaded automatically during the \`npm install\` process via platform-specific optional dependencies.

## Roadmap & Planned Features

We are actively working on enhancing `webp-conv`. Future plans include:

- [ ] **WebP to Video:** Conversion to formats like MP4 and WebM.
- [ ] **Reverse Conversion:** Support for converting GIF/PNG back to WebP.
- [ ] **Batch Processing:** Efficiently convert multiple files at once.
- [ ] **Command-Line Interface (CLI):** Allow using the converter directly from the terminal.
- [ ] **Performance Optimizations:** Further improvements for handling very large files.
- [ ] **Expanded Format Support:** Investigate support for other relevant output image formats.
- [ ] **Image Manipulation API:** Options for resizing, cropping, or other modifications during conversion.

## Development

Interested in contributing? Follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/caed0/webp-conv.git
    cd webp-conv
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run tests:** Ensure the basic setup is correct.
    ```bash
    npm test
    ```
4.  **Make your changes:** Implement your feature or bug fix.
5.  **Test your changes:** Use the example runner or add new tests.
    ```bash
    npm run conv
    # or add/modify tests in the 'test' directory and run 'npm test'
    ```
6.  **Submit a Pull Request:** We appreciate your contributions!

## License

This project is licensed under the **MIT License**. See the LICENSE file for full details.

The underlying **libwebp** library is distributed under its own license. Please refer to the libwebp license documentation for more information.

## Contributing & Issues

We welcome contributions and feedback!

- **Bug Reports & Feature Requests:** If you encounter any issues or have ideas for improvements, please create an issue on the GitHub repository. Provide as much detail as possible, including steps to reproduce, error messages, and your environment (OS, Node.js version).
- **Pull Requests:** Contributions via Pull Requests are highly encouraged. Please ensure your code adheres to the project's style and includes tests where applicable.

## Acknowledgments

- The **WebM Project team** at Google for developing and maintaining the essential `libwebp` library.
- All **contributors and maintainers** who help improve and support this project.
