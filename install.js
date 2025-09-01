/**
 * @file install.js
 * @description Post-install script for downloading and setting up libwebp binaries
 * @author caed0
 * @version 2.1.2
 * 
 * This script automatically downloads the appropriate libwebp binary package
 * based on the current operating system and CPU architecture, extracts it,
 * and sets up the directory structure required by the converter.
 * 
 * @requires child_process
 * @requires os
 * @requires path
 * @requires fs
 * @requires https
 */

const { execSync } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");
const https = require("https");

/**
 * @constant {string} LIBWEBP_VERSION - Version of libwebp to download
 */
const LIBWEBP_VERSION = "1.5.0";

/**
 * @constant {string} BASE_URL - Base URL for libwebp releases
 */
const BASE_URL = `https://storage.googleapis.com/downloads.webmproject.org/releases/webp/`;

/**
 * @constant {string} EXTRACT_DIR - Target directory for extracted files
 */
const EXTRACT_DIR = path.join(__dirname, "libwebp");

/**
 * @constant {string} PLATFORM - Current operating system platform
 */
const PLATFORM = os.platform();

/**
 * @constant {string} ARCH - Current CPU architecture
 */
const ARCH = os.arch();

let fileName = null;

if (PLATFORM === "linux" && ARCH === "x64") {
  fileName = `libwebp-${LIBWEBP_VERSION}-linux-x86-64.tar.gz`;
} else if (PLATFORM === "linux" && ARCH === "arm64") {
  fileName = `libwebp-${LIBWEBP_VERSION}-linux-aarch64.tar.gz`;
} else if (PLATFORM === "darwin" && ARCH === "x64") {
  fileName = `libwebp-${LIBWEBP_VERSION}-mac-x86-64.tar.gz`;
} else if (PLATFORM === "darwin" && ARCH === "arm64") {
  fileName = `libwebp-${LIBWEBP_VERSION}-mac-arm64.tar.gz`;
} else if (PLATFORM === "win32" && ARCH === "x64") {
  fileName = `libwebp-${LIBWEBP_VERSION}-windows-x64.zip`;
} else {
  console.error("❌ Unsupported OS or architecture:", PLATFORM, ARCH);
  process.exit(1);
}

const fileUrl = BASE_URL + fileName;
const outputFile = path.join(__dirname, fileName);

/**
 * Downloads a file from URL to local destination
 * @param {string} url - URL of file to download
 * @param {string} dest - Local destination path
 * @param {Function} callback - Callback function to execute on completion
 * @throws {Error} Terminates process on download failure or HTTP error
 */
function downloadFile(url, dest, callback) {
  console.log(`► Downloading: ${url}`);
  const file = fs.createWriteStream(dest);
  https
    .get(url, (response) => {
      if (response.statusCode !== 200) {
        console.error(`❌ Failed to download: ${url}`);
        process.exit(1);
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close(callback);
      });
    })
    .on("error", (err) => {
      console.error("❌ Download error:", err);
      process.exit(1);
    });
}

downloadFile(fileUrl, outputFile, () => {
  console.log(`✅ Downloaded ${fileName}`);

  try {
    if (fs.existsSync(EXTRACT_DIR)) fs.rmSync(EXTRACT_DIR, { recursive: true });

    if (PLATFORM === "win32") {
      execSync(`tar -xf "${outputFile}" -C "${__dirname}"`, {
        stdio: "inherit",
      });
    } else {
      execSync(`tar -xzf "${outputFile}" -C "${__dirname}"`, {
        stdio: "inherit",
      });
    }

    const extractedDir = fs
      .readdirSync(__dirname)
      .find((dir) => dir.startsWith(`libwebp-${LIBWEBP_VERSION}`));
    fs.renameSync(path.join(__dirname, extractedDir), EXTRACT_DIR);
    fs.unlinkSync(outputFile);
    console.log("✅ Extracted and renamed successfully!");
  } catch (error) {
    console.error("❌ Extraction failed:", error);
    process.exit(1);
  }
});
