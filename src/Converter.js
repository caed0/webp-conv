const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { Image } = require("node-webpmux");
const GIFEncoder = require('gif-encoder-2');
const { loadImage, createCanvas } = require('canvas');
const os = require("os");

const execFileAsync = (file, args) => {
  return new Promise((resolve, reject) => {
    execFile(file, args, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
};

const waitForFrames = async (folder, expectedCount) => {
  while (fs.readdirSync(folder).length !== expectedCount) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
};

class Converter {
  #BINARIES = path.join(path.resolve(__dirname, '..'), 'libwebp', 'bin');
  #ANIM_DUMP = path.join(this.#BINARIES, 'anim_dump');
  #DWEBP = path.join(this.#BINARIES, 'dwebp');
  #defaultOptions = {
    quality: 10,
    transparent: '0x000000'
  };

  constructor(defaultOptions = {}) {
    this.#defaultOptions = { ...this.#defaultOptions, ...defaultOptions };
  }

  /**
   * Convert WebP files using job objects
   * @param {Object|Array} jobs - Single job object or array of job objects
   * @returns {Promise<string|Array>} - Output path(s) of converted file(s)
   */
  async convertJobs(jobs) {
    if (!jobs) throw new Error("Jobs parameter is required");
    
    const isArray = Array.isArray(jobs);
    const jobArray = isArray ? jobs : [jobs];
    
    // Validate all jobs first
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

  #generateOutputPath(inputPath) {
    const dir = path.dirname(inputPath);
    const basename = path.basename(inputPath, '.webp');
    
    // Check if it's an animated WebP to determine output format
    try {
      const buffer = fs.readFileSync(inputPath);
      // Simple check for animation by looking for ANIM chunk
      const isAnimated = buffer.includes(Buffer.from('ANIM'));
      const ext = isAnimated ? '.gif' : '.png';
      return path.join(dir, `${basename}${ext}`);
    } catch (error) {
      // Default to .png if we can't determine
      return path.join(dir, `${basename}.png`);
    }
  }

  async #processJob(job) {
    const input = job.input;
    const output = job.output || this.#generateOutputPath(input);
    const jobOptions = { ...this.#defaultOptions, ...job.settings };
    
    return await this.convert(input, output, jobOptions, true); // true flag to suppress deprecation warning
  }

  /**
   * Convert a single WebP file (DEPRECATED)
   * @deprecated Use convertJobs() instead for better functionality and job-based processing
   * @param {string} input - Path to input WebP file
   * @param {string} output - Path to output file
   * @param {Object} options - Conversion options
   * @param {boolean} suppressWarning - Internal flag to suppress deprecation warning
   * @returns {Promise<string>} - Path to converted file
   */
  async convert(input, output, options = {}, suppressWarning = false) {
    // Show deprecation warning only when called directly by user
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

    const cleanupFolder = () => {
      try {
        if (fs.existsSync(folder)) {
          fs.rmSync(folder, { recursive: true });
        }
      } catch (error) {
        cleanupAttempts++;
        if (cleanupAttempts < maxCleanupAttempts) {
          // Wait a bit and try again
          setTimeout(cleanupFolder, 100);
        }
        // If we can't clean up after several attempts, just continue
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
      
      // Wait a moment for encoder to finish writing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clean up the temporary folder
      cleanupFolder();
    } catch (error) {
      // Clean up on error
      cleanupFolder();
      throw error;
    }
    return output;
  }
}

module.exports = Converter;