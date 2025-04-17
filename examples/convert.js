/**
 * @file examples/convert.js
 * @description Example script demonstrating how to use the webp-conv Converter.
 *              Converts a list of WebP images (static and animated) to
 *              their target formats (PNG or GIF) sequentially.
 */

// Import necessary modules
const path = require("path");
// Assuming index.js correctly exports the Converter class
// Use 'Converter' (uppercase) by convention for classes
const Converter = require("../index.js");

// --- Configuration ---

// Instantiate the converter
// The constructor will verify if the necessary binaries (dwebp, anim_dump) exist.
let converter;
try {
  converter = new Converter();
  console.log("ℹ️ Converter initialized successfully.");
} catch (error) {
  console.error("❌ Failed to initialize Converter:", error.message);
  console.error(
    "   Please ensure libwebp binaries were installed correctly (run 'npm install' or 'node install.js')."
  );
  process.exit(1); // Exit if converter cannot be created
}

// Define the conversion jobs
// Each object contains input path, output path, and optional conversion options.
// Using path.join ensures cross-platform compatibility (Windows uses \, others use /)
const conversionJobs = [
  {
    input: path.join(__dirname, "images", "animated.webp"),
    output: path.join(__dirname, "output", "animated.gif"),
    // Options specific to GIF conversion
    // Quality: 1-100 (lower number means better quality for gif-encoder-2, 1=best, 100=worst mapped to 1-30 range)
    // Transparent: Hex color string (e.g., '0xffffff') or number (e.g., 0xffffff)
    options: { quality: 90, transparent: "0x000000" },
  },
  {
    input: path.join(__dirname, "images", "animated-transparent.webp"),
    output: path.join(__dirname, "output", "animated-transparent.gif"),
    // Example with different quality, default transparency ('0x000000') will be used if omitted
    options: { quality: 95 },
  },
  {
    input: path.join(__dirname, "images", "static.webp"),
    output: path.join(__dirname, "output", "static.png"),
    // No options needed/used for PNG conversion.
    // The converter ignores irrelevant options like quality/transparent for PNG.
  },
  // --- Add more conversion jobs here if needed ---
  // Example of a potential failure (file doesn't exist)
  // {
  //     input: path.join(__dirname, 'images', 'non-existent.webp'),
  //     output: path.join(__dirname, 'output', 'non-existent.png')
  // }
];

// --- Main Execution Logic ---

/**
 * Asynchronously runs all defined conversion jobs sequentially.
 * Logs the progress and outcome of each conversion.
 * Sets the process exit code based on the outcome.
 */
async function processConversions() {
  console.log("🚀 Starting image conversion process...");
  let successCount = 0;
  let failureCount = 0;

  // Ensure the output directory exists (although the Converter class also does this)
  // This is good practice in the calling script as well.
  // Check if conversionJobs is empty before accessing index 0
  if (conversionJobs.length === 0) {
    console.warn("⚠️ No conversion jobs defined. Exiting.");
    return;
  }
  const outputBaseDir = path.dirname(conversionJobs[0].output); // Assumes all outputs share a base dir
  try {
    // Use fs.promises for async file system operations
    const fs = require("fs").promises;
    await fs.mkdir(outputBaseDir, { recursive: true });
    console.log(`✅ Output directory ensured: ${outputBaseDir}`);
  } catch (error) {
    console.error(
      `❌ Failed to create base output directory ${outputBaseDir}:`,
      error
    );
    console.error("   Cannot proceed without output directory.");
    process.exitCode = 1; // Set failure exit code
    return; // Stop if we can't create the output dir
  }

  // Process each job one by one using await in a for...of loop
  for (const job of conversionJobs) {
    console.log(
      `\n⏳ Processing: ${path.basename(job.input)} -> ${path.basename(
        job.output
      )}`
    );
    try {
      // Await the conversion. Pass options if they exist, otherwise an empty object.
      // The Converter class handles internal checks (file existence, type, etc.)
      const resultPath = await converter.convert(
        job.input,
        job.output,
        job.options || {}
      );
      console.log(`✅ Success: Conversion complete. Output: ${resultPath}`);
      successCount++;
    } catch (error) {
      // Log detailed error messages if conversion fails
      console.error(`❌ Error converting ${path.basename(job.input)}:`);
      // Log the specific error message provided by the converter or other issues
      console.error(`   Reason: ${error.message}`);
      // Optionally log the full stack trace for deeper debugging:
      // console.error(error);
      failureCount++;
      // Decide whether to continue with the next job or stop.
      // For this example, we log the error and continue.
    }
  }

  console.log("\n🏁 Conversion process finished.");
  console.log(
    `   Summary: ${successCount} successful, ${failureCount} failed.`
  );

  // --- Moved Exit Code Logic Here ---
  // Set exit code based on failures *within* the function scope
  if (conversionJobs.length > 0 && failureCount === conversionJobs.length) {
    console.log("   ⚠️ All conversion jobs failed.");
    process.exitCode = 1; // Indicate failure if all jobs failed
  } else if (failureCount > 0) {
    console.log("   ⚠️ Some conversion jobs failed.");
    // Indicate partial success/failure if needed. Often, exit code 0 is still used
    // unless *all* jobs failed, but setting to 1 is also reasonable.
    // Let's set it to 1 to clearly indicate *something* went wrong.
    process.exitCode = 1;
  }
  // If failureCount is 0, process.exitCode remains undefined (defaults to 0 on normal exit)
  // --- End of Moved Logic ---
}

// --- Script Entry Point ---

// Execute the main async function and catch any top-level unexpected errors
processConversions()
  .then(() => {
    // This block now only runs if processConversions completes without throwing an error.
    // The exit code logic is handled inside the function.
    console.log("✨ Example script finished.");
  })
  .catch((error) => {
    // This catch block is for unexpected errors *outside* the loop's try/catch
    // or errors thrown *before* the loop (like the mkdir failure).
    console.error(
      "🚨 An unexpected top-level error occurred during the script execution:",
      error
    );
    process.exitCode = 1; // Indicate failure
  });
