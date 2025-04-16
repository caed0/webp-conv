/**
 * @file test-install.js
 * @description Verification script for libwebp binaries (anim_dump, dwebp).
 *
 * This script performs a series of checks to ensure that the necessary libwebp
 * command-line tools, downloaded and extracted by `install.js`, are present
 * and executable. It verifies:
 *   1. The existence of the `libwebp/bin` directory.
 *   2. The existence of the platform-specific binary files (`anim_dump`/`anim_dump.exe`
 *      and `dwebp`/`dwebp.exe`) within the `bin` directory.
 *   3. The executability of each binary by running it with the `-version` flag.
 *
 * If any check fails, the script logs a detailed error message and exits with
 * a non-zero status code, indicating a failed installation or setup. If all
 * checks pass, it logs success messages, including the version reported by each binary.
 *
 * @requires module:fs - Node.js File System module for checking file existence.
 * @requires module:os - Node.js OS module for determining the operating system platform.
 * @requires module:path - Node.js Path module for constructing file paths reliably.
 * @requires module:child_process - Node.js Child Process module for executing the binaries.
 *
 * @constant {string} BASE_DIR - The root directory of the project (__dirname).
 * @constant {string} LIBWEBP_DIR - The expected path to the extracted libwebp library directory.
 * @constant {string} BIN_DIR - The expected path to the directory containing the libwebp binaries.
 * @constant {boolean} IS_WINDOWS - Flag indicating if the current platform is Windows.
 * @constant {Array<object>} BINARIES_TO_CHECK - An array of objects, each describing a binary to verify.
 * @constant {string} BINARIES_TO_CHECK[].name - The base name of the binary (without extension).
 * @constant {string} BINARIES_TO_CHECK[].label - A user-friendly label for the binary used in logs.
 *
 * @function verifyBinary
 * @description Checks for the existence and executability of a single specified binary.
 * @param {string} baseName - The base name of the binary (e.g., "dwebp").
 * @param {string} label - A user-friendly label for logging (e.g., "dwebp").
 * @throws {Error} If the binary is not found or fails to execute.
 *
 * @function main
 * @description Orchestrates the verification process for all required binaries.
 *              Checks for the existence of the binary directory first, then iterates
 *              through `BINARIES_TO_CHECK`, calling `verifyBinary` for each.
 *              Logs overall success or failure messages. Exits process on failure.
 *
 * @example
 * // Run this script from the command line using Node.js:
 * // $ node test-install.js
 * //
 * // Expected output on success:
 * // 🚀 Starting libwebp binary verification...
 * // ► Verifying anim_dump...
 * //   ✅ Found anim_dump binary at: /path/to/project/libwebp/bin/anim_dump
 * //   ✅ anim_dump executed successfully.
 * //      anim_dump Version: 1.5.0
 * // ► Verifying dwebp...
 * //   ✅ Found dwebp binary at: /path/to/project/libwebp/bin/dwebp
 * //   ✅ dwebp executed successfully.
 * //      dwebp Version: 1.5.0
 * //
 * // 🎉 All required libwebp binaries verified successfully!
 * //
 * // Expected output on failure (e.g., binary not found):
 * // 🚀 Starting libwebp binary verification...
 * // ► Verifying anim_dump...
 * // ❌ ERROR: anim_dump binary not found at /path/to/project/libwebp/bin/anim_dump.
 * //    Please ensure the installation script (install.js) completed successfully.
 * //
 * // ❌ Binary verification failed. See errors above.
 * // (Process exits with code 1)
 */

// --- Core Node.js Modules ---
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

// --- Configuration Constants ---

/**
 * @constant {string} BASE_DIR
 * @description The root directory where the script is located. Assumed to be the project root.
 */
const BASE_DIR = __dirname;

/**
 * @constant {string} LIBWEBP_DIR
 * @description The directory where the libwebp library is expected to be extracted.
 *              This should match the `EXTRACT_DIR` in `install.js`.
 */
const LIBWEBP_DIR = path.join(BASE_DIR, "libwebp");

/**
 * @constant {string} BIN_DIR
 * @description The directory within `LIBWEBP_DIR` containing the executable binaries.
 */
const BIN_DIR = path.join(LIBWEBP_DIR, "bin");

/**
 * @constant {boolean} IS_WINDOWS
 * @description A flag indicating whether the current operating system is Windows.
 *              Used to determine the correct binary file extension (.exe).
 */
const IS_WINDOWS = os.platform() === "win32";

/**
 * @constant {Array<object>} BINARIES_TO_CHECK
 * @description A list of binaries that need to be verified. Each object specifies
 *              the base name and a user-friendly label for logging.
 */
const BINARIES_TO_CHECK = [
  { name: "anim_dump", label: "anim_dump" },
  { name: "dwebp", label: "dwebp" },
];

// --- Helper Functions ---

/**
 * Verifies the existence and basic execution (-version flag) of a single libwebp binary.
 *
 * @param {string} baseName The base name of the binary file (e.g., "dwebp").
 * @param {string} label A user-friendly name for the binary used in log messages (e.g., "dwebp").
 * @throws {Error} Throws an error if the binary is not found at the expected path
 *                 or if executing it with the "-version" flag fails. The error
 *                 message provides context about the failure.
 * @returns {void} Does not return a value, but logs success messages to the console.
 */
function verifyBinary(baseName, label) {
  /**
   * @description The platform-specific name of the binary file (e.g., "dwebp" or "dwebp.exe").
   * @type {string}
   */
  const binaryFileName = IS_WINDOWS ? `${baseName}.exe` : baseName;

  /**
   * @description The full, absolute path to the binary file.
   * @type {string}
   */
  const binaryPath = path.join(BIN_DIR, binaryFileName);

  console.log(`► Verifying ${label}...`);

  // 1. Check if the binary file exists
  if (!fs.existsSync(binaryPath)) {
    const errorMessage = `${label} binary not found at ${binaryPath}.`;
    console.error(`❌ ERROR: ${errorMessage}`);
    console.error(
      "   Please ensure the installation script (install.js) completed successfully."
    );
    // Throw an error to be caught by the main execution logic
    throw new Error(errorMessage);
  }
  console.log(`  ✅ Found ${label} binary at: ${binaryPath}`);

  // 2. Attempt to execute the binary with the -version flag
  try {
    /**
     * @description The output captured from executing the binary's version command.
     * @type {string}
     */
    const versionOutput = execSync(`"${binaryPath}" -version`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"], // Capture stdout/stderr, ignore stdin
    });
    console.log(`  ✅ ${label} executed successfully.`);
    // Log the trimmed version output for confirmation
    console.log(`     ${label} Version: ${versionOutput.trim()}`);
  } catch (error) {
    // Catch errors during execution (e.g., permission issues, binary crashes)
    const errorMessage = `Failed to execute ${label} binary at ${binaryPath}.`;
    console.error(`❌ ERROR: ${errorMessage}`);
    // Provide more details from the caught error object
    console.error("   Error details:", error.message);
    // Include stderr if available, as it often contains useful diagnostic info
    if (error.stderr) {
      console.error("   Stderr:", error.stderr.toString().trim());
    }
    // Include stdout if available (less common for errors, but possible)
    if (error.stdout) {
      console.error("   Stdout:", error.stdout.toString().trim());
    }
    // Throw an error to signal failure to the main execution logic
    throw new Error(errorMessage);
  }
}

// --- Main Execution Logic ---

/**
 * Main function to orchestrate the verification process.
 * It checks for the binary directory's existence and then iterates
 * through the defined binaries, calling `verifyBinary` for each.
 * Handles overall success and failure reporting.
 *
 * @async (Implicitly, though no awaits are used here)
 * @returns {void}
 */
function main() {
  console.log("🚀 Starting libwebp binary verification...");

  // Pre-check: Ensure the main binary directory exists
  if (!fs.existsSync(BIN_DIR)) {
    console.error(`❌ CRITICAL: Binary directory not found at ${BIN_DIR}.`);
    console.error(
      "   The installation script (install.js) might have failed or the structure is incorrect."
    );
    process.exit(1); // Exit immediately, no point proceeding
  } else {
    console.log(`ℹ️  Found binary directory: ${BIN_DIR}`);
  }

  let allVerified = true; // Assume success initially

  // Iterate through each binary defined in the configuration
  for (const binaryInfo of BINARIES_TO_CHECK) {
    try {
      // Attempt to verify the current binary
      verifyBinary(binaryInfo.name, binaryInfo.label);
    } catch (error) {
      // If verifyBinary throws an error, log that verification failed overall
      // Specific error details are already logged within verifyBinary
      allVerified = false;
      // Stop checking further binaries once one fails
      break;
    }
  }

  // Final status reporting based on the verification loop outcome
  if (allVerified) {
    console.log("\n🎉 All required libwebp binaries verified successfully!");
    // Optionally, exit with 0 for success (though Node.js does this by default)
    // process.exit(0);
  } else {
    console.error("\n❌ Binary verification failed. See errors above.");
    // Exit with a non-zero status code to indicate failure
    process.exit(1);
  }
}

// --- Script Entry Point ---

// Execute the main function when the script is run
main();
