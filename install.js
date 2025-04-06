/**
 * @file install.js
 * @description Script for downloading, extracting, and setting up the libwebp library.
 *
 * This file determines the correct libwebp archive to download based on the operating system
 * and CPU architecture. It downloads the archive, extracts its contents,
 * renames the extracted directory to "libwebp", and cleans up the downloaded archive.
 *
 * @constant {string} LIBWEBP_VERSION - The version of libwebp to download.
 * @constant {string} BASE_URL - The base URL for the libwebp releases.
 * @constant {string} EXTRACT_DIR - The target directory for extracted libwebp files.
 * @constant {string} PLATFORM - The operating system platform (e.g., 'linux', 'darwin', 'win32').
 * @constant {string} ARCH - The CPU architecture (e.g., 'x64', 'arm64').
 * @constant {(string|null)} fileName - The generated file name for the libwebp archive based on OS and architecture.
 * @constant {string} fileUrl - The complete URL to download the libwebp archive.
 * @constant {string} outputFile - The local filesystem path where the downloaded archive is saved.
 *
 * @function downloadFile
 * @description Downloads a file from a given URL and saves it to a specified destination.
 * @param {string} url - The URL of the file to be downloaded.
 * @param {string} dest - The local path where the file will be saved.
 * @param {Function} callback - The function to call once the download has completed.
 * @throws Will terminate the process if the download fails (non-200 HTTP status code) or if an error occurs.
 *
 * @see {@link https://nodejs.org/api/child_process.html} for execSync usage.
 * @see {@link https://nodejs.org/api/os.html} for OS detection.
 * @see {@link https://nodejs.org/api/path.html} for path management.
 * @see {@link https://nodejs.org/api/fs.html} for filesystem operations.
 * @see {@link https://nodejs.org/api/https.html} for HTTPS module usage.
 */

const { execSync } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");
const https = require("https");

const LIBWEBP_VERSION = "1.5.0";
const BASE_URL = `https://storage.googleapis.com/downloads.webmproject.org/releases/webp/`;
const EXTRACT_DIR = path.join(__dirname, "libwebp");

const PLATFORM = os.platform();
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
