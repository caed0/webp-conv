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
    https.get(url, (response) => {
        if (response.statusCode !== 200) {
            console.error(`❌ Failed to download: ${url}`);
            process.exit(1);
        }
        response.pipe(file);
        file.on("finish", () => {
            file.close(callback);
        });
    }).on("error", (err) => {
        console.error("❌ Download error:", err);
        process.exit(1);
    });
}

downloadFile(fileUrl, outputFile, () => {
    console.log(`✅ Downloaded ${fileName}`);

    try {
        if (fs.existsSync(EXTRACT_DIR)) fs.rmSync(EXTRACT_DIR, { recursive: true });

        if (PLATFORM === "win32") {
            execSync(`tar -xf ${outputFile} -C ${__dirname}`, { stdio: "inherit" });
        } else {
            execSync(`tar -xzf ${outputFile} -C ${__dirname}`, { stdio: "inherit" });
        }

        const extractedDir = fs.readdirSync(__dirname).find(dir => dir.startsWith(`libwebp-${LIBWEBP_VERSION}`));
        fs.renameSync(path.join(__dirname, extractedDir), EXTRACT_DIR);
        fs.unlinkSync(outputFile);
        console.log("✅ Extracted and renamed successfully!");
    } catch (error) {
        console.error("❌ Extraction failed:", error);
        process.exit(1);
    }
});
