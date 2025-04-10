/**
 * @file test-install.js
 *
 * @description
 * This script verifies the installation of the anim_dump and dwebp binaries. It performs the following tasks:
 *   - Determines the binary names based on the operating system.
 *   - Constructs the expected paths to the binaries located under the "libwebp/bin" directory.
 *   - Checks if the binaries exist at the computed paths.
 *   - Executes the binaries with the "-version" flag and captures their outputs.
 *   - Logs a success message if the executions are successful.
 *   - Logs an error message and exits the process with a non-zero code if any binary is missing or the execution fails.
 *
 * @requires fs - For file system operations.
 * @requires os - To detect the operating system.
 * @requires path - To handle file paths.
 * @requires child_process.execSync - To execute the binaries synchronously.
 *
 * @example
 * // Run the script from the command line with Node.js:
 * // $ node test-install.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const binaries = [
  { name: os.platform() === "win32" ? "anim_dump.exe" : "anim_dump", label: "anim_dump" },
  { name: os.platform() === "win32" ? "dwebp.exe" : "dwebp", label: "dwebp" },
];

binaries.forEach(({ name, label }) => {
  const binaryPath = path.join(__dirname, "libwebp", "bin", name);

  if (!fs.existsSync(binaryPath)) {
    console.error(`❌ ${label} binary not found. Please ensure the installation was completed successfully.`);
    process.exit(1);
  }

  try {
    const versionOutput = execSync(`"${binaryPath}" -version`, {
      encoding: "utf8",
    });
    console.log(`✅ ${label} installation verified successfully!`);
    console.log(`${label} Version: ${versionOutput.trim()}`);
  } catch (error) {
    console.error(`❌ Error executing the ${label} binary:`, error);
    process.exit(1);
  }
});
