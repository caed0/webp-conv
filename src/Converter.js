/**
 * @file src/Converter.js
 * @description Defines the Converter class responsible for converting WebP images (static and animated) to other formats (PNG, GIF).
 *
 * This module utilizes external binaries (`dwebp`, `anim_dump`) provided by the `libwebp` library,
 * which are expected to be installed in the project's `libwebp/bin` directory via the `install.js` script.
 * It leverages libraries like `node-webpmux` for parsing WebP metadata, `gif-encoder-2` for creating
 * animated GIFs, and `canvas` for frame manipulation during GIF conversion.
 *
 * @requires module:fs - Node.js File System module (sync and async operations).
 * @requires module:fs/promises - Node.js Promises-based File System module.
 * @requires module:path - Node.js Path module for handling file paths.
 * @requires module:child_process - Node.js module for executing external binaries.
 * @requires module:os - Node.js OS module for accessing the temporary directory.
 * @requires module:node-webpmux - Library for reading WebP file structure and metadata.
 * @requires module:gif-encoder-2 - Library for encoding animated GIFs.
 * @requires module:canvas - Library for image manipulation using a Canvas API implementation.
 */

// --- Core Node.js Modules ---
const fs = require("fs");
const fsPromises = require("fs").promises; // Import promises API
const path = require("path");
const { execFile } = require("child_process");
const os = require("os");

// --- Third-Party Dependencies ---
const { Image } = require("node-webpmux"); // For reading WebP metadata and structure
const GIFEncoder = require("gif-encoder-2"); // For creating animated GIFs
const { loadImage, createCanvas } = require("canvas"); // For processing image frames

// --- Constants ---
/**
 * @constant {string} LIBWEBP_DIR_NAME
 * @description The expected name of the directory containing the libwebp library relative to the project root.
 */
const LIBWEBP_DIR_NAME = "libwebp";

/**
 * @constant {string} BIN_SUBDIR
 * @description The subdirectory within the libwebp directory where binaries are located.
 */
const BIN_SUBDIR = "bin";

/**
 * @constant {number} DEFAULT_GIF_QUALITY
 * @description Default quality setting for GIF encoding (lower is better quality, 1-30).
 * @default 10
 */
const DEFAULT_GIF_QUALITY = 10;

/**
 * @constant {string} DEFAULT_TRANSPARENT_COLOR
 * @description Default hex color code used for transparency in GIFs.
 * @default '0x000000'
 */
const DEFAULT_TRANSPARENT_COLOR = "0x000000"; // Black as default transparent color

/**
 * @constant {string} TEMP_FOLDER_PREFIX
 * @description Prefix used for creating temporary directories in the OS temp folder.
 */
const TEMP_FOLDER_PREFIX = "webp-conv-";

/**
 * @constant {number} WAIT_FOR_FRAMES_POLL_INTERVAL_MS
 * @description Interval (in milliseconds) for polling the temporary directory when waiting for extracted frames.
 * @default 50
 */
const WAIT_FOR_FRAMES_POLL_INTERVAL_MS = 50;

/**
 * @constant {number} WAIT_FOR_FRAMES_TIMEOUT_MS
 * @description Maximum time (in milliseconds) to wait for frames to be extracted by anim_dump before timing out.
 * @default 30000 (30 seconds)
 */
const WAIT_FOR_FRAMES_TIMEOUT_MS = 30000;

// --- Utility Functions ---

/**
 * Promisified version of `child_process.execFile`.
 * Executes a file with specified arguments.
 *
 * @function execFileAsync
 * @param {string} file - The path to the executable file.
 * @param {string[]} args - An array of string arguments to pass to the executable.
 * @param {object} [options={}] - Options for `child_process.execFile`.
 * @returns {Promise<{stdout: string, stderr: string}>} A promise that resolves with stdout and stderr on success, or rejects with an error.
 */
const execFileAsync = (file, args, options = {}) => {
  return new Promise((resolve, reject) => {
    execFile(file, args, options, (error, stdout, stderr) => {
      if (error) {
        // Attach stdout/stderr to the error object for better debugging
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

/**
 * Waits until the expected number of files appear in a specified folder, with a timeout.
 * Uses asynchronous `fs.promises.readdir` to avoid blocking the event loop.
 *
 * @async
 * @function waitForFrames
 * @param {string} folderPath - The path to the directory to monitor.
 * @param {number} expectedCount - The number of files expected to be in the directory.
 * @param {number} timeout - Maximum time in milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves when the expected count is reached, or rejects on timeout or error.
 * @throws {Error} If the timeout is reached before the expected number of files appear.
 * @throws {Error} If there's an error reading the directory.
 */
const waitForFrames = async (folderPath, expectedCount, timeout) => {
  const startTime = Date.now();
  while (true) {
    // Check for timeout
    if (Date.now() - startTime > timeout) {
      let currentCount = 0;
      try {
        // Attempt to read count one last time for the error message
        currentCount = (await fsPromises.readdir(folderPath)).length;
      } catch (e) {
        /* Ignore error reading count for timeout message, folder might be gone */
      }
      throw new Error(
        `Timeout: Time expired (${timeout}ms) waiting for ${expectedCount} frames in ${folderPath}. Found ${currentCount} files.`
      );
    }

    try {
      // Use async readdir
      const files = await fsPromises.readdir(folderPath);
      if (files.length === expectedCount) {
        return; // Success! Expected number of files found.
      }
      // Add a check for *more* files than expected, which might indicate an issue.
      if (files.length > expectedCount) {
        console.warn(
          `Warning: Found more files (${files.length}) than expected (${expectedCount}) in ${folderPath}. Proceeding.`
        );
        return; // Proceed even if more files are found (might be harmless)
      }
    } catch (error) {
      // Handle potential errors during readdir (e.g., directory removed prematurely)
      if (error.code === "ENOENT") {
        throw new Error(
          `Error: Temporary directory ${folderPath} not found while waiting for frames.`
        );
      }
      throw new Error(
        `Error reading directory ${folderPath} while waiting for frames: ${error.message}`
      );
    }

    // Wait for the polling interval before checking again
    await new Promise((resolve) =>
      setTimeout(resolve, WAIT_FOR_FRAMES_POLL_INTERVAL_MS)
    );
  }
};

/**
 * @class Converter
 * @description Provides methods to convert WebP images to other formats.
 *              Handles both static WebP -> PNG and animated WebP -> GIF conversions.
 */
class Converter {
  /**
   * @private
   * @type {string}
   * @description Base path to the directory containing libwebp binaries.
   */
  #BIN_PATH;
  /**
   * @private
   * @type {string}
   * @description Full path to the 'anim_dump' executable.
   */
  #ANIM_DUMP_PATH;
  /**
   * @private
   * @type {string}
   * @description Full path to the 'dwebp' executable.
   */
  #DWEBP_PATH;
  /**
   * @private
   * @type {boolean}
   * @description Flag indicating if the required binaries were found during initialization.
   */
  #binariesVerified = false;

  /**
   * Creates an instance of the Converter.
   * Initializes paths to the required libwebp binaries and performs an initial check for their existence.
   * @constructor
   * @throws {Error} If the libwebp binary directory or required executables (`anim_dump`, `dwebp`) are not found.
   */
  constructor() {
    // Construct the expected path to the binaries relative to the package root
    const baseDir = path.resolve(__dirname, ".."); // Assumes src is one level down from root
    this.#BIN_PATH = path.join(baseDir, LIBWEBP_DIR_NAME, BIN_SUBDIR);

    // Determine platform-specific binary names
    const isWindows = os.platform() === "win32";
    const animDumpExe = isWindows ? "anim_dump.exe" : "anim_dump";
    const dwebpExe = isWindows ? "dwebp.exe" : "dwebp";

    this.#ANIM_DUMP_PATH = path.join(this.#BIN_PATH, animDumpExe);
    this.#DWEBP_PATH = path.join(this.#BIN_PATH, dwebpExe);

    // Verify binaries exist upon instantiation
    this.#verifyBinaries();
  }

  /**
   * @private
   * @description Checks if the required libwebp binaries exist at their expected paths.
   * @throws {Error} If the binary directory or a required binary is not found.
   */
  #verifyBinaries() {
    if (!fs.existsSync(this.#BIN_PATH)) {
      throw new Error(
        `libwebp binary directory not found at: ${
          this.#BIN_PATH
        }. Please verify that package installation (npm install) completed successfully and ran the install.js script.`
      );
    }
    if (!fs.existsSync(this.#ANIM_DUMP_PATH)) {
      throw new Error(
        `'anim_dump' executable not found at: ${
          this.#ANIM_DUMP_PATH
        }. Please verify that package installation completed successfully.`
      );
    }
    if (!fs.existsSync(this.#DWEBP_PATH)) {
      throw new Error(
        `'dwebp' executable not found at: ${
          this.#DWEBP_PATH
        }. Please verify that package installation completed successfully.`
      );
    }
    this.#binariesVerified = true;
    // console.log("ℹ️ libwebp binaries successfully verified."); // Optional log
  }

  /**
   * @private
   * @async
   * @description Checks if a WebP file is animated using node-webpmux.
   * @param {string} inputPath - Path to the WebP file.
   * @returns {Promise<boolean>} True if the image is animated (more than 1 frame), false otherwise or if metadata cannot be read.
   */
  async #isAnimatedWebP(inputPath) {
    const img = new Image();
    try {
      await img.load(inputPath);
      // Consider animated if anim data exists and there's more than one frame
      return !!(img.anim && img.anim.frames && img.anim.frames.length > 1);
    } catch (error) {
      // Log warning and assume not animated if metadata reading fails
      console.warn(
        `Warning: Unable to read WebP metadata from ${inputPath} to check animation: ${error.message}`
      );
      return false;
    }
  }

  /**
   * Converts a WebP image file to either PNG or GIF format.
   *
   * @async
   * @method convert
   * @param {string} inputPath - The path to the input WebP file.
   * @param {string} outputPath - The desired path for the output file (.png or .gif).
   * @param {object} [options={}] - Conversion options.
   * @param {number} [options.quality=${DEFAULT_GIF_QUALITY}] - GIF quality (1-100, lower is better quality, used for GIF only). gif-encoder-2 uses 1-30 range internally.
   * @param {string} [options.transparent=${DEFAULT_TRANSPARENT_COLOR}] - Hex color string (e.g., '0xffffff') for GIF transparency (used for GIF only).
   * @returns {Promise<string>} A promise that resolves with the path to the successfully created output file.
   * @throws {Error} If input/output paths are missing or invalid.
   * @throws {Error} If the input file doesn't exist or is not a .webp file.
   * @throws {Error} If the output file extension is not supported (.png, .gif).
   * @throws {Error} If the required binaries were not found during initialization.
   * @throws {Error} If `dwebp` or `anim_dump` execution fails.
   * @throws {Error} If attempting to convert a non-animated WebP to GIF.
   * @throws {Error} If GIF frame extraction times out or fails.
   * @throws {Error} If image loading or canvas operations fail.
   * @throws {Error} If GIF encoding fails.
   */
  async convert(inputPath, outputPath, options = {}) {
    // --- Input Validation ---
    if (!this.#binariesVerified) {
      throw new Error(
        "Converter initialization failed: libwebp binaries not verified."
      );
    }
    if (!inputPath) throw new Error("Input file path is required.");
    if (!outputPath) throw new Error("Output file path is required.");

    try {
      // Use async stat for better performance than existsSync + statSync
      const stats = await fsPromises.stat(inputPath);
      if (!stats.isFile()) {
        throw new Error(`Input path is not a file: ${inputPath}`);
      }
    } catch (e) {
      if (e.code === "ENOENT") {
        throw new Error(`Input file not found: ${inputPath}`);
      }
      // Catch other errors from fs.promises.stat (e.g., permission denied)
      throw new Error(`Error accessing input file ${inputPath}: ${e.message}`);
    }

    const inputExt = path.extname(inputPath).toLowerCase();
    const outputExt = path.extname(outputPath).toLowerCase();

    if (inputExt !== ".webp") {
      throw new Error(`Input file must be a .webp file: ${inputPath}`);
    }
    if (![".gif", ".png"].includes(outputExt)) {
      throw new Error(
        `Output file extension must be .png or .gif: ${outputPath}`
      );
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    try {
      // Check existence before creating to avoid unnecessary calls
      // Using sync here is generally acceptable for setup tasks, but async could be used too.
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        // console.log(`ℹ️ Output directory created: ${outputDir}`); // Optional log
      }
    } catch (e) {
      throw new Error(
        `Failed to create output directory ${outputDir}: ${e.message}`
      );
    }

    // --- Option Processing ---
    const rawQuality =
      options.quality === undefined
        ? DEFAULT_GIF_QUALITY
        : Math.max(1, Math.min(100, options.quality));
    const gifEncoderQuality = Math.round(30 - (rawQuality / 100) * 29);

    const transparentColor =
      options.transparent !== undefined
        ? options.transparent
        : DEFAULT_TRANSPARENT_COLOR;

    // --- Conversion Logic ---

    // 1. Static WebP to PNG conversion
    if (outputExt === ".png") {
      // Note: We allow converting animated WebP to PNG (dwebp extracts the first frame).
      // If you want to prevent this, add an #isAnimatedWebP check here and throw an error.
      try {
        // console.log(`► Converting ${inputPath} to PNG using dwebp...`); // Optional log
        await execFileAsync(this.#DWEBP_PATH, [inputPath, "-o", outputPath]);
        // console.log(`✅ PNG conversion successful: ${outputPath}`); // Optional log
        return outputPath;
      } catch (error) {
        throw new Error(
          `Failed to execute dwebp for ${inputPath}: ${
            error.stderr || error.message
          }`
        );
      }
    }

    // 2. Animated WebP to GIF conversion
    if (outputExt === ".gif") {
      // *** Check if the input is actually animated BEFORE proceeding ***
      const isAnimated = await this.#isAnimatedWebP(inputPath);
      if (!isAnimated) {
        throw new Error(
          `Input file '${inputPath}' is not an animated WebP. GIF conversion requires an animation.`
        );
      }

      // console.log(`► Converting ${inputPath} to GIF...`); // Optional log
      let tempFolderPath = null; // Define here to be accessible in finally block

      try {
        // Load WebP metadata again (needed for frame details, width, height etc.)
        // #isAnimatedWebP only checks for animation existence, not details.
        const img = new Image();
        await img.load(inputPath);

        const width = img.width;
        const height = img.height;
        if (!width || !height) {
          throw new Error(`Unable to determine dimensions for ${inputPath}`);
        }
        // We already know it's animated from the check above, so animData should exist.
        const animData = img.anim;
        const rawFrames = animData.frames;
        const loopCount = animData.loops === undefined ? 0 : animData.loops;

        // Create GIF encoder
        const encoder = new GIFEncoder(
          width,
          height,
          "neuquant",
          true,
          rawFrames.length
        );

        const writeStream = fs.createWriteStream(outputPath);
        encoder.createReadStream().pipe(writeStream);

        encoder.start();
        encoder.setRepeat(loopCount);
        encoder.setTransparent(transparentColor);
        encoder.setQuality(gifEncoderQuality);

        // Create temporary directory using async for consistency, though sync is often fine here.
        tempFolderPath = await fsPromises.mkdtemp(
          path.join(os.tmpdir(), TEMP_FOLDER_PREFIX)
        );
        // console.log(`ℹ️ Temporary directory created: ${tempFolderPath}`); // Optional log

        // Extract frames using anim_dump
        // console.log(`► Extracting frames using anim_dump to ${tempFolderPath}...`); // Optional log
        try {
          await execFileAsync(this.#ANIM_DUMP_PATH, [
            "-folder",
            tempFolderPath,
            inputPath,
          ]);
        } catch (error) {
          throw new Error(
            `Failed to execute anim_dump: ${error.stderr || error.message}`
          );
        }

        // Wait for anim_dump to finish writing all frames (using async waitForFrames)
        // console.log(`► Waiting for ${rawFrames.length} frames...`); // Optional log
        await waitForFrames(
          tempFolderPath,
          rawFrames.length,
          WAIT_FOR_FRAMES_TIMEOUT_MS
        );
        // console.log(`✅ Expected number of frames found.`); // Optional log

        // Process each extracted frame
        // console.log(`► Processing and encoding ${rawFrames.length} frames...`); // Optional log
        const frameFiles = (await fsPromises.readdir(tempFolderPath)) // Use async readdir
          .filter((file) => path.extname(file).toLowerCase() === ".png")
          .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
            const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
            return numA - numB;
          });

        if (frameFiles.length !== rawFrames.length) {
          console.warn(
            `Warning: Number of PNG files found (${frameFiles.length}) does not match expected frame count (${rawFrames.length}). Proceeding with found files.`
          );
        }

        for (let i = 0; i < frameFiles.length; i++) {
          const frameFileName = frameFiles[i];
          const framePath = path.join(tempFolderPath, frameFileName);
          const ctx = createCanvas(width, height).getContext("2d");
          const image = await loadImage(framePath);
          ctx.drawImage(image, 0, 0, width, height);

          // Alpha Channel Handling (as before)
          const imageData = ctx.getImageData(0, 0, width, height);
          const pixelData = imageData.data;
          for (let j = 0; j < pixelData.length; j += 4) {
            if (pixelData[j + 3] > 0 && pixelData[j + 3] < 128) {
              pixelData[j + 3] = 0;
            }
          }
          ctx.putImageData(imageData, 0, 0);

          const delay = rawFrames[i]?.delay || 100;
          encoder.setDelay(delay);
          encoder.addFrame(ctx);
          // console.log(`  Frame ${i + 1}/${frameFiles.length} encoded`); // Optional log
        }

        encoder.finish();
        // console.log(`✅ GIF encoding finished: ${outputPath}`); // Optional log

        await new Promise((resolve, reject) => {
          writeStream.on("finish", resolve);
          writeStream.on("error", (err) =>
            reject(
              new Error(
                `Error writing final GIF file ${outputPath}: ${err.message}`
              )
            )
          );
        });

        return outputPath;
      } finally {
        // Cleanup: Remove the temporary directory regardless of success or failure
        if (tempFolderPath) {
          try {
            // console.log(`► Cleaning up temporary directory: ${tempFolderPath}`); // Optional log
            // Use async rm for consistency
            await fsPromises.rm(tempFolderPath, {
              recursive: true,
              force: true,
            });
            // console.log(`✅ Temporary directory cleaned up.`); // Optional log
          } catch (cleanupError) {
            console.error(
              `Warning: Failed to clean up temporary directory ${tempFolderPath}: ${cleanupError.message}`
            );
          }
        }
      }
    }

    // Should not be reached if validation is correct
    throw new Error("Unsupported conversion type or unexpected failure.");
  }
}

module.exports = Converter;
