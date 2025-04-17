/**
 * @file index.js
 * @description Main entry point for the 'webp-conv' package.
 *
 * This module serves as the public interface for the 'webp-conv' library.
 * It imports the core `Converter` class/functionality from the internal
 * `./src/Converter.js` module and exports it directly. Users of this package
 * should import this module to access the conversion features.
 *
 * @module webp-conv
 * @version 1.0.0 // Example version - consider linking to package.json or updating manually
 * @license MIT // Example license - adjust as needed
 *
 * @requires module:./src/Converter - The module containing the actual implementation of the Converter class/logic.
 *
 * @exports Converter as webp-conv - Exports the imported Converter class/object as the primary export of the package.
 *
 * @see module:./src/Converter - For details on the Converter implementation.
 *
 * @example
 * // How to import and use the Converter from this package:
 * const Converter = require('webp-conv'); // Assuming 'webp-conv' is the installed package name
 *
 * // Assuming Converter is a class that needs instantiation (adjust if it's a function)
 * const converter = new Converter();
 *
 * async function performConversion(inputFile, outputFile, options) {
 *   try {
 *     console.log(`Attempting to convert ${inputFile} to ${outputFile}`);
 *     // Assuming an async 'convert' method exists (adjust based on actual API)
 *     const result = await converter.convert(inputFile, outputFile, options);
 *     console.log('Conversion successful:', result);
 *     return result;
 *   } catch (error) {
 *     console.error(`Error converting ${inputFile}:`, error);
 *     throw error; // Re-throw or handle as needed
 *   }
 * }
 *
 * // Example usage:
 * const inputImagePath = './images/source.jpg';
 * const outputImagePath = './images/output.webp';
 * const conversionOptions = { quality: 75 }; // Example options
 *
 * performConversion(inputImagePath, outputImagePath, conversionOptions)
 *   .then(() => console.log('Process finished.'))
 *   .catch(() => console.error('Process failed.'));
 *
 */

// --- Core Dependency ---

/**
 * @description Imports the main Converter class/functionality from the source file.
 *              This is the core logic that handles the image conversion process.
 * @type {import('./src/Converter')} // Attempt to provide type hint if Converter is a class/has types
 */
const Converter = require("./src/Converter.js");

// --- Module Export ---

/**
 * @description Exports the imported `Converter` as the public API of this package.
 *              When users `require('webp-conv')`, they will receive this `Converter`.
 */
module.exports = Converter;

// --- Type Definition (Optional, for documentation/intellisense) ---
// If Converter is a class, you might have a corresponding .d.ts file
// or define the type more explicitly here if needed, though often
// the @type hint on the require statement is sufficient.
// For example:
// /**
//  * Represents the main converter utility.
//  * @typedef {import('./src/Converter').Converter} Converter
//  */
