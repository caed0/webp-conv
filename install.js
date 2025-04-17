/**
 * @file install.js
 * @description Script for downloading, extracting, and setting up the appropriate libwebp binaries.
 *
 * This script automates the process of obtaining the correct pre-compiled libwebp
 * utilities (like dwebp, anim_dump) for the current operating system and CPU architecture.
 * It performs the following steps:
 *   1. Determines the target platform (OS) and architecture (CPU).
 *   2. Constructs the specific filename and download URL for the corresponding libwebp archive.
 *   3. Downloads the archive file from the official WebM project storage.
 *   4. Cleans up any previous 'libwebp' directory.
 *   5. Extracts the contents of the downloaded archive.
 *   6. Renames the extracted top-level directory (which includes the version number)
 *      to a consistent name ('libwebp').
 *   7. Deletes the downloaded archive file.
 *
 * If any step fails (unsupported platform, download error, extraction error),
 * it logs a detailed error message and exits with a non-zero status code.
 *
 * @requires module:child_process - For executing shell commands (like 'tar').
 * @requires module:os - For detecting the operating system and architecture.
 * @requires module:path - For handling file and directory paths reliably.
 * @requires module:fs - For filesystem operations (writing files, checking existence, renaming, deleting).
 * @requires module:https - For making HTTPS requests to download the archive.
 *
 * @constant {string} LIBWEBP_VERSION - The specific version of libwebp to download.
 * @constant {string} BASE_URL - The base URL for libwebp release downloads.
 * @constant {string} TARGET_DIR_NAME - The final desired name for the directory containing libwebp binaries ("libwebp").
 * @constant {string} BASE_DIR - The root directory where the script is located (__dirname).
 * @constant {string} FINAL_EXTRACT_PATH - The full path to the target directory for extracted libwebp files.
 * @constant {string} PLATFORM - The detected operating system platform (e.g., 'linux', 'darwin', 'win32').
 * @constant {string} ARCH - The detected CPU architecture (e.g., 'x64', 'arm64').
 *
 * @function getArchiveInfo
 * @description Determines the correct archive filename and type based on platform, architecture, and version.
 * @param {string} platform - The OS platform (e.g., 'linux').
 * @param {string} arch - The CPU architecture (e.g., 'x64').
 * @param {string} version - The libwebp version string.
 * @returns {{fileName: string, type: 'tar.gz' | 'zip'} | null} An object containing the filename and archive type,
 *          or null if the platform/architecture combination is unsupported.
 *
 * @function downloadFile
 * @description Downloads a file from a URL to a specified destination path.
 * @param {string} url - The URL of the file to download.
 * @param {string} destPath - The local filesystem path to save the downloaded file.
 * @returns {Promise<void>} A promise that resolves when the download is complete, or rejects on error.
 *
 * @function extractArchive
 * @description Extracts the downloaded archive using the appropriate command.
 * @param {string} archivePath - The path to the archive file (.tar.gz or .zip).
 * @param {string} destinationDir - The directory where the archive should be extracted.
 * @param {'tar.gz' | 'zip'} type - The type of the archive.
 * @returns {Promise<string>} A promise that resolves with the name of the top-level extracted directory, or rejects on error.
 *
 * @function setupLibwebpDirectory
 * @description Renames the dynamically named extracted directory to the standard target name.
 * @param {string} extractedDirName - The name of the directory created during extraction (e.g., 'libwebp-1.5.0-linux-x86-64').
 * @param {string} finalPath - The desired final path for the libwebp directory.
 * @returns {Promise<void>} A promise that resolves on successful rename, or rejects on error.
 *
 * @function cleanup
 * @description Removes the downloaded archive file.
 * @param {string} archivePath - The path to the archive file to remove.
 * @returns {Promise<void>} A promise that resolves on successful deletion, or rejects on error.
 *
 * @function main
 * @description Orchestrates the entire download, extraction, and setup process.
 * @async
 * @returns {Promise<void>} A promise that resolves on successful completion, or rejects on failure.
 *
 * @example
 * // Run this script from the command line using Node.js:
 * // $ node install.js
 * //
 * // Expected output on success:
 * // ℹ️  Platform: linux, Arch: x64, Version: 1.5.0
 * // ℹ️  Determined archive: libwebp-1.5.0-linux-x86-64.tar.gz
 * // ► Downloading: https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.5.0-linux-x86-64.tar.gz
 * //   to /path/to/project/libwebp-1.5.0-linux-x86-64.tar.gz
 * // ✅ Download complete: /path/to/project/libwebp-1.5.0-linux-x86-64.tar.gz
 * // ► Cleaning up existing directory: /path/to/project/libwebp
 * // ► Extracting /path/to/project/libwebp-1.5.0-linux-x86-64.tar.gz to /path/to/project
 * // ✅ Extraction complete. Extracted directory: libwebp-1.5.0-linux-x86-64
 * // ► Renaming extracted directory libwebp-1.5.0-linux-x86-64 to libwebp
 * // ✅ Renamed successfully to: /path/to/project/libwebp
 * // ► Cleaning up archive: /path/to/project/libwebp-1.5.0-linux-x86-64.tar.gz
 * // ✅ Archive cleanup successful.
 * // 🎉 libwebp setup completed successfully!
 *
 * // Expected output on failure (e.g., unsupported platform):
 * // ℹ️  Platform: freebsd, Arch: x64, Version: 1.5.0
 * // ❌ ERROR: Unsupported OS or architecture combination: freebsd / x64
 * // (Process exits with code 1)
 */

// --- Core Node.js Modules ---
const { exec } = require("child_process"); // Using exec for potentially better error handling than execSync
const os = require("os");
const path = require("path");
const fs = require("fs");
const https = require("https");

// --- Configuration Constants ---

/** @constant {string} The version of libwebp to download. */
const LIBWEBP_VERSION = "1.5.0";
/** @constant {string} The base URL for libwebp release downloads. */
const BASE_URL = `https://storage.googleapis.com/downloads.webmproject.org/releases/webp/`;
/** @constant {string} The final desired name for the directory containing libwebp binaries. */
const TARGET_DIR_NAME = "libwebp";
/** @constant {string} The root directory where the script is located. */
const BASE_DIR = __dirname;
/** @constant {string} The full path to the target directory for extracted libwebp files. */
const FINAL_EXTRACT_PATH = path.join(BASE_DIR, TARGET_DIR_NAME);
/** @constant {string} The detected operating system platform. */
const PLATFORM = os.platform();
/** @constant {string} The detected CPU architecture. */
const ARCH = os.arch();

// --- Helper Functions ---

/**
 * Determines the correct archive filename and type based on platform, architecture, and version.
 * @param {string} platform - The OS platform (e.g., 'linux').
 * @param {string} arch - The CPU architecture (e.g., 'x64').
 * @param {string} version - The libwebp version string.
 * @returns {{fileName: string, type: 'tar.gz' | 'zip'} | null} Archive info or null if unsupported.
 */
function getArchiveInfo(platform, arch, version) {
  const mapping = {
    "linux-x64": { suffix: "linux-x86-64", type: "tar.gz" },
    "linux-arm64": { suffix: "linux-aarch64", type: "tar.gz" },
    "darwin-x64": { suffix: "mac-x86-64", type: "tar.gz" },
    "darwin-arm64": { suffix: "mac-arm64", type: "tar.gz" },
    "win32-x64": { suffix: "windows-x64", type: "zip" },
    // Add other supported combinations here if needed
  };

  const key = `${platform}-${arch}`;
  const info = mapping[key];

  if (info) {
    return {
      fileName: `libwebp-${version}-${info.suffix}.${info.type}`,
      type: info.type,
    };
  }

  return null; // Unsupported combination
}

/**
 * Downloads a file from a URL to a specified destination path.
 * Uses Promises for better async handling.
 * @param {string} url - The URL of the file to download.
 * @param {string} destPath - The local filesystem path to save the downloaded file.
 * @returns {Promise<void>} A promise that resolves when the download is complete, or rejects on error.
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`► Downloading: ${url}`);
    console.log(`  to ${destPath}`);
    const file = fs.createWriteStream(destPath);

    const request = https.get(url, (response) => {
      // Check for non-200 status codes
      if (response.statusCode < 200 || response.statusCode >= 300) {
        // Consume response data to free up memory
        response.resume();
        // Attempt to remove the partially downloaded file
        fs.unlink(destPath, () => {}); // Ignore errors on unlink
        return reject(
          new Error(
            `Failed to download ${url}. Status Code: ${response.statusCode}`
          )
        );
      }

      // Pipe the response stream to the file stream
      response.pipe(file);

      // Handle successful download completion
      file.on("finish", () => {
        file.close((err) => {
          if (err) {
            return reject(
              new Error(
                `Error closing file stream for ${destPath}: ${err.message}`
              )
            );
          }
          console.log(`✅ Download complete: ${destPath}`);
          resolve();
        });
      });
    });

    // Handle network errors during the request
    request.on("error", (err) => {
      // Attempt to remove the partially downloaded file
      fs.unlink(destPath, () => {}); // Ignore errors on unlink
      reject(new Error(`Download error for ${url}: ${err.message}`));
    });

    // Handle errors on the file stream (e.g., disk full, permissions)
    file.on("error", (err) => {
      // Attempt to remove the partially downloaded file
      fs.unlink(destPath, () => {}); // Ignore errors on unlink
      reject(new Error(`File stream error for ${destPath}: ${err.message}`));
    });
  });
}

/**
 * Extracts the downloaded archive using the 'tar' command.
 * Note: Assumes 'tar' is available in the system's PATH and can handle both .tar.gz and .zip.
 *       For more robust .zip handling on Windows, consider a dedicated library like 'extract-zip'.
 * @param {string} archivePath - The path to the archive file (.tar.gz or .zip).
 * @param {string} destinationDir - The directory where the archive should be extracted.
 * @param {'tar.gz' | 'zip'} type - The type of the archive.
 * @returns {Promise<string>} A promise that resolves with the name of the top-level extracted directory, or rejects on error.
 */
function extractArchive(archivePath, destinationDir, type) {
  return new Promise((resolve, reject) => {
    console.log(`► Extracting ${archivePath} to ${destinationDir}`);

    // Choose the correct tar flags based on the archive type
    const flags = type === "zip" ? "xf" : "xzf"; // 'x' = extract, 'f' = file, 'z' = gzip (for .tar.gz)
    const command = `tar -${flags} "${archivePath}" -C "${destinationDir}"`;

    // Execute the tar command
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // Log stderr for debugging, as it often contains useful info from tar
        console.error("❌ Extraction command stderr:", stderr);
        return reject(
          new Error(`Extraction failed for ${archivePath}: ${error.message}`)
        );
      }

      // --- Determine the name of the extracted directory ---
      // This assumes the archive extracts to a single top-level directory
      // named like 'libwebp-VERSION-SUFFIX'.
      const expectedPrefix = `libwebp-${LIBWEBP_VERSION}`;
      try {
        const entries = fs.readdirSync(destinationDir);
        const extractedDirName = entries.find(
          (entry) =>
            entry.startsWith(expectedPrefix) &&
            fs.statSync(path.join(destinationDir, entry)).isDirectory()
        );

        if (!extractedDirName) {
          return reject(
            new Error(
              `Could not find expected extracted directory starting with "${expectedPrefix}" in ${destinationDir}`
            )
          );
        }
        console.log(
          `✅ Extraction complete. Extracted directory: ${extractedDirName}`
        );
        resolve(extractedDirName);
      } catch (fsError) {
        reject(
          new Error(
            `Error reading destination directory ${destinationDir} after extraction: ${fsError.message}`
          )
        );
      }
    });
  });
}

/**
 * Prepares the target directory by removing it if it exists.
 * @param {string} dirPath - The path to the directory to clean up.
 * @returns {Promise<void>} A promise that resolves on successful cleanup or if the directory doesn't exist, rejects on error.
 */
function cleanupExistingDirectory(dirPath) {
  return new Promise((resolve, reject) => {
    console.log(`► Cleaning up existing directory: ${dirPath}`);
    fs.rm(dirPath, { recursive: true, force: true }, (err) => {
      if (err) {
        // Don't reject if the error is just that the file doesn't exist
        if (err.code === "ENOENT") {
          console.log(
            `  Directory ${dirPath} did not exist, no cleanup needed.`
          );
          return resolve();
        }
        return reject(
          new Error(
            `Failed to remove existing directory ${dirPath}: ${err.message}`
          )
        );
      }
      console.log(`  Successfully removed ${dirPath} (if it existed).`);
      resolve();
    });
  });
}

/**
 * Renames the dynamically named extracted directory to the standard target name.
 * @param {string} extractedDirName - The name of the directory created during extraction (e.g., 'libwebp-1.5.0-linux-x86-64').
 * @param {string} finalPath - The desired final path for the libwebp directory (e.g., '/path/to/project/libwebp').
 * @returns {Promise<void>} A promise that resolves on successful rename, or rejects on error.
 */
function setupLibwebpDirectory(extractedDirName, finalPath) {
  return new Promise((resolve, reject) => {
    const sourcePath = path.join(BASE_DIR, extractedDirName);
    console.log(
      `► Renaming extracted directory ${extractedDirName} to ${TARGET_DIR_NAME}`
    );
    fs.rename(sourcePath, finalPath, (err) => {
      if (err) {
        return reject(
          new Error(
            `Failed to rename ${sourcePath} to ${finalPath}: ${err.message}`
          )
        );
      }
      console.log(`✅ Renamed successfully to: ${finalPath}`);
      resolve();
    });
  });
}

/**
 * Removes the downloaded archive file.
 * @param {string} archivePath - The path to the archive file to remove.
 * @returns {Promise<void>} A promise that resolves on successful deletion, or rejects on error.
 */
function cleanup(archivePath) {
  return new Promise((resolve, reject) => {
    console.log(`► Cleaning up archive: ${archivePath}`);
    fs.unlink(archivePath, (err) => {
      if (err) {
        // Don't fail if the file is already gone
        if (err.code === "ENOENT") {
          console.warn(
            `  Warning: Archive file ${archivePath} not found for cleanup.`
          );
          return resolve();
        }
        return reject(
          new Error(
            `Failed to delete archive file ${archivePath}: ${err.message}`
          )
        );
      }
      console.log("✅ Archive cleanup successful.");
      resolve();
    });
  });
}

// --- Main Execution Logic ---

/**
 * Orchestrates the entire download, extraction, and setup process using async/await.
 * @async
 * @returns {Promise<void>} A promise that resolves on successful completion, or rejects on failure.
 */
async function main() {
  console.log(
    `ℹ️  Platform: ${PLATFORM}, Arch: ${ARCH}, Version: ${LIBWEBP_VERSION}`
  );

  // 1. Determine archive details
  const archiveInfo = getArchiveInfo(PLATFORM, ARCH, LIBWEBP_VERSION);
  if (!archiveInfo) {
    // Use throw new Error here which will be caught by the outer catch block
    throw new Error(
      `Unsupported OS or architecture combination: ${PLATFORM} / ${ARCH}`
    );
  }
  console.log(`ℹ️  Determined archive: ${archiveInfo.fileName}`);

  const fileUrl = BASE_URL + archiveInfo.fileName;
  const localArchivePath = path.join(BASE_DIR, archiveInfo.fileName);

  try {
    // 2. Download the archive
    await downloadFile(fileUrl, localArchivePath);

    // 3. Clean up any old installation directory
    await cleanupExistingDirectory(FINAL_EXTRACT_PATH);

    // 4. Extract the archive
    const extractedDirName = await extractArchive(
      localArchivePath,
      BASE_DIR, // Extract directly into the base directory
      archiveInfo.type
    );

    // 5. Rename the extracted directory
    await setupLibwebpDirectory(extractedDirName, FINAL_EXTRACT_PATH);

    // 6. Clean up the downloaded archive
    await cleanup(localArchivePath);

    console.log("\n🎉 libwebp setup completed successfully!");
  } catch (error) {
    // Catch any error from the async functions above
    console.error(`\n❌ ERROR during installation: ${error.message}`);
    // Attempt to clean up the downloaded archive if it exists, ignoring errors
    await cleanup(localArchivePath).catch(() => {});
    process.exit(1); // Exit with failure code
  }
}

// --- Script Entry Point ---

// Execute the main function and handle potential top-level errors
main().catch((error) => {
  // This catch is primarily for errors thrown directly in main() before the try block,
  // like the unsupported platform error. Errors within the try block are handled there.
  console.error(`\n❌ FATAL ERROR: ${error.message}`);
  process.exit(1);
});
