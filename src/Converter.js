/**
 * @file Converter.js
 * @description WebP to GIF/PNG converter with support for animated and static WebP files
 * @author caed0
 * @version 2.1.2
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { Image } = require("node-webpmux");
const GIFEncoder = require('gif-encoder-2');
const { loadImage, createCanvas } = require('canvas');
const os = require("os");

/**
 * Promisified version of execFile for async/await usage
 * @function
 * @private
 * @async
 * @param {string} file - Path to executable file
 * @param {string[]} args - Arguments to pass to the executable
 * @returns {Promise<void>} Resolves when execution completes
 * @throws {Error} When the child process exits with an error
 */
const execFileAsync = (file, args) => {
  return new Promise((resolve, reject) => {
    execFile(file, args, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
};

/**
 * Waits for the specified number of frames to be extracted to a folder.
 * @function
 * @private
 * @async
 * @param {string} folder - Path to folder containing extracted frames
 * @param {number} expectedCount - Expected number of frames
 * @returns {Promise<void>} Resolves when all frames are available
 */
const waitForFrames = async (folder, expectedCount) => {
  while (fs.readdirSync(folder).length !== expectedCount) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
};

/**
 * Conversion options for GIF/PNG output.
 * @typedef {Object} ConverterOptions
 * @property {number} [quality=10] - GIF quality (1-100, lower = smaller file)
 * @property {string} [transparent='0x000000'] - Transparent color as `0xRRGGBB`.
 */

/**
 * A single conversion job describing input and desired output.
 * @typedef {Object} Job
 * @property {string} input - Path to input WebP file
 * @property {string} [output] - Output path; auto-generated when omitted
 * @property {ConverterOptions} [settings] - Per-job conversion settings
 */

/**
 * WebP to GIF/PNG converter class.
 * @class
 * @classdesc Provides high-level APIs to convert static and animated WebP images
 * into PNG or GIF outputs. For multiple conversions, prefer {@link Converter#convertJobs}.
 * @category Public API
 */
class Converter {
  /**
  * Path to libwebp binaries directory
  * @type {string}
  * @private
   */
  #BINARIES = path.join(path.resolve(__dirname, '..'), 'libwebp', 'bin');
  
  /**
  * Path to anim_dump executable
  * @type {string}
  * @private
   */
  #ANIM_DUMP = path.join(this.#BINARIES, 'anim_dump');
  
  /**
  * Path to dwebp executable
  * @type {string}
  * @private
   */
  #DWEBP = path.join(this.#BINARIES, 'dwebp');
  
  /**
  * Default conversion options
  * @type {Object}
  * @private
   */
  #defaultOptions = {
    quality: 10,
    transparent: '0x000000'
  };

  /**
   * Creates a new Converter instance.
   * @param {ConverterOptions} [defaultOptions={}] - Default options for conversions
   * @example
   * const Converter = require('@caed0/webp-conv');
   * const conv = new Converter({ quality: 80, transparent: '0x000000' });
   */
  constructor(defaultOptions = {}) {
    this.#defaultOptions = { ...this.#defaultOptions, ...defaultOptions };
  }

  /**
   * Convert WebP files using job objects.
   * @category Public API
   * @async
   * @param {(Job|Job[])} jobs - A single job or an array of jobs
   * @returns {Promise<string|string[]>} Output path(s) of converted file(s)
   * @throws {Error} When jobs are missing/invalid or input is not a WebP
   * @example
   * // Single job
   * await converter.convertJobs({
   *   input: 'path/to/input.webp',
   *   output: 'path/to/output.gif',
   *   settings: { quality: 80 }
   * });
   *
   * // Multiple jobs
   * await converter.convertJobs([
   *   { input: 'file1.webp', settings: { quality: 90 } },
   *   { input: 'file2.webp', output: 'custom.png' }
   * ]);
   */
  async convertJobs(jobs) {
    if (!jobs) throw new Error("Jobs parameter is required");
    
    const isArray = Array.isArray(jobs);
    const jobArray = isArray ? jobs : [jobs];
    
    for (const job of jobArray) {
      this.#validateJob(job);
    }
    
    const results = [];
    for (const job of jobArray) {
      const result = await this.#processJob(job);
      results.push(result);
    }
    
    return isArray ? results : results[0];
  }

  /**
   * Validates a job object for required properties and file existence
   * @private
   * @param {Object} job - Job object to validate
   * @param {string} job.input - Path to input WebP file
   * @throws {Error} When job is invalid, input missing, file doesn't exist, or not a WebP file
   */
  #validateJob(job) {
    if (!job || typeof job !== 'object') {
      throw new Error("Job must be an object");
    }
    if (!job.input) {
      throw new Error("Job must have an 'input' property with the path to the input file");
    }
    if (!fs.existsSync(job.input)) {
      throw new Error(`Input file does not exist (${job.input})`);
    }
    if (!fs.statSync(job.input).isFile()) {
      throw new Error(`Input is not a file (${job.input})`);
    }
    if (path.extname(job.input) !== '.webp') {
      throw new Error(`Input file is not a webp file (${job.input})`);
    }
  }

  /**
   * Generates an appropriate output path based on input file and WebP type detection.
   * @private
   * @param {string} inputPath - Path to input WebP file
   * @returns {string} Output path (.gif for animated, .png for static)
   */
  #generateOutputPath(inputPath) {
    const dir = path.dirname(inputPath);
    const basename = path.basename(inputPath, '.webp');
    
    try {
      const buffer = fs.readFileSync(inputPath);
      const isAnimated = buffer.includes(Buffer.from('ANIM'));
      const ext = isAnimated ? '.gif' : '.png';
      return path.join(dir, `${basename}${ext}`);
    } catch (error) {
      return path.join(dir, `${basename}.png`);
    }
  }

  /**
   * Processes a single job by merging options and calling the convert method.
   * @private
   * @async
   * @param {Job} job - Job object to process
   * @returns {Promise<string>} Path to converted file
   */
  async #processJob(job) {
    const input = job.input;
    const output = job.output || this.#generateOutputPath(input);
    const jobOptions = { ...this.#defaultOptions, ...job.settings };
    
    return await this.convert(input, output, jobOptions, true);
  }

  /**
   * Convert a single WebP file to GIF or PNG format.
   * @category Public API
   * @deprecated Use {@link Converter#convertJobs} for job-based processing.
   * @async
   * @param {string} input - Path to input WebP file
   * @param {string} output - Path to output file (.gif or .png)
   * @param {ConverterOptions} [options={}] - Conversion options
   * @param {boolean} [suppressWarning=false] - Internal flag to suppress the deprecation warning
   * @returns {Promise<string>} Path to converted file
   * @throws {Error} If validation fails or conversion errors occur
   * @example
   * // Convert animated WebP to GIF
   * await converter.convert('input.webp', 'output.gif', { quality: 80 });
   *
   * // Convert static WebP to PNG
   * await converter.convert('static.webp', 'output.png');
   */
  async convert(input, output, options = {}, suppressWarning = false) {
    if (!suppressWarning) {
      console.warn('⚠️  WARNING: The convert() method is deprecated. Please use convertJobs() instead for better functionality and job-based processing.');
    }
    
    if (!input) throw new Error("Input is required");
    if (!output) throw new Error("Output is required");
    if (!fs.existsSync(input)) throw new Error(`Input file does not exist (${input})`);
    if (!fs.statSync(input).isFile()) throw new Error("Input is not a file");
    if (path.extname(input) !== '.webp') throw new Error("Input file is not a webp file");
    if (!['.gif', '.png'].includes(path.extname(output))) throw new Error("Output file must be a gif or png");

    const mergedOptions = { ...this.#defaultOptions, ...options };
    const quality = mergedOptions.quality;
    const transparent = mergedOptions.transparent;

    if (output.endsWith('.png')) {
      await execFileAsync(this.#DWEBP, [input, '-o', output]);
      return output;
    }

    const img = new Image();
    await img.load(input);
    await img.initLib();
    const { width, height, data } = img;
    const rawFrames = data.anim.frames;

    const encoder = new GIFEncoder(width, height, 'neuquant', true, rawFrames.length);
    encoder.createReadStream().pipe(fs.createWriteStream(output));
    encoder.start();
    encoder.setRepeat(data.anim.loops);
    encoder.setTransparent(transparent);
    encoder.setQuality(quality);

    const folder = path.join(os.tmpdir(), 'webp-conv', path.basename(input));
    if (fs.existsSync(folder)) {
      try {
        fs.rmSync(folder, { recursive: true });
      } catch (error) {
        // Ignore cleanup errors for existing folder
      }
    }
    fs.mkdirSync(folder, { recursive: true });

    let cleanupAttempts = 0;
    const maxCleanupAttempts = 5;

    /**
     * Attempts to clean up temporary folder with retry logic
     * @private
     */
    const cleanupFolder = () => {
      try {
        if (fs.existsSync(folder)) {
          fs.rmSync(folder, { recursive: true });
        }
      } catch (error) {
        cleanupAttempts++;
        if (cleanupAttempts < maxCleanupAttempts) {
          setTimeout(cleanupFolder, 100);
        }
      }
    };

    try {
      await execFileAsync(this.#ANIM_DUMP, ['-folder', folder, input]);
      await waitForFrames(folder, Object.keys(rawFrames).length);

      const frames = fs.readdirSync(folder).filter(file => path.extname(file) === '.png');
      for (let i = 0; i < frames.length; i++) {
        const framePath = path.join(folder, frames[i]);
        const ctx = createCanvas(width, height).getContext('2d');
        const image = await loadImage(framePath);
        ctx.drawImage(image, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let j = 0; j < data.length; j += 4) {
          if (data[j + 3] > 0 && data[j + 3] < 128) data[j + 3] = 0;
        }

        ctx.putImageData(imageData, 0, 0);
        encoder.setDelay(rawFrames[i].delay);
        encoder.addFrame(ctx);
      }

      encoder.finish();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      cleanupFolder();
    } catch (error) {
      cleanupFolder();
      throw error;
    }
    return output;
  }
}

module.exports = Converter;