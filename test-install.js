/**
 * @file test-install.js
 *
 * @description
 * This script verifies the installation of the cwebp binary. It performs the following tasks:
 *   - Determines the binary name based on the operating system (cwebp.exe for Windows, cwebp for others).
 *   - Constructs the expected path to the binary located under the "libwebp/bin" directory.
 *   - Checks if the binary exists at the computed path.
 *   - Executes the binary with the "--version" flag and captures its output.
 *   - Logs a success message and the version if the execution is successful.
 *   - Logs an error message and exits the process with a non-zero code if the binary is missing or the execution fails.
 *
 * @requires fs - For file system operations.
 * @requires os - To detect the operating system.
 * @requires path - To handle file paths.
 * @requires child_process.execSync - To execute the binary synchronously.
 *
 * @example
 * // Run the script from the command line with Node.js:
 * // $ node test-install.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

// Determine the binary name based on the operating system
const binaryName = os.platform() === "win32" ? "cwebp.exe" : "cwebp";
const binaryPath = path.join(__dirname, "libwebp", "bin", binaryName);

if (!fs.existsSync(binaryPath)) {
  console.error(
    "❌ Binary not found. Please ensure the installation was completed successfully."
  );
  process.exit(1);
}

try {
  // Execute the binary with -version flag and capture its output
  const versionOutput = execSync(`"${binaryPath}" -version`, {
    encoding: "utf8",
  });
  console.log("✅ Installation verified successfully!");
  console.log(`Version: ${versionOutput.trim()}`);
} catch (error) {
  console.error("❌ Error executing the binary:", error);
  process.exit(1);
}
