/**
 * @file index.js
 * @description Main entry point for the webp-conv package
 * @author caed0
 * @version 2.1.2
 * @module webp-conv
 * @requires ./src/Converter
 * @example
 * const WebPConverter = require('@caed0/webp-conv');
 * const converter = new WebPConverter({ quality: 80 });
 * 
 * // Convert using job objects (recommended)
 * const result = await converter.convertJobs({
 *   input: 'input.webp',
 *   output: 'output.gif',
 *   settings: { quality: 90 }
 * });
 */
const Converter = require("./src/Converter.js");
module.exports = Converter;
