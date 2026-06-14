#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SW_PATH = path.join(__dirname, "../../public/sw.js");
const VERSION_PATTERN = /const\s+APP_VERSION\s*=\s*['"]([^'"]+)['"]/;
const BUILD_ID_TOKEN = "__BUILD_ID__";

if (!fs.existsSync(SW_PATH)) {
    console.error(`[check:sw-version] FAILED: cannot find ${SW_PATH}`);
    process.exit(1);
}

const source = fs.readFileSync(SW_PATH, "utf8");
const match = source.match(VERSION_PATTERN);
if (!match) {
    console.error("[check:sw-version] FAILED: APP_VERSION declaration was not found in public/sw.js");
    process.exit(1);
}

const currentVersion = match[1];
if (currentVersion !== BUILD_ID_TOKEN) {
    console.error(
        `[check:sw-version] FAILED: APP_VERSION must be \"${BUILD_ID_TOKEN}\" in public/sw.js, found \"${currentVersion}\".`
    );
    console.error("[check:sw-version] Use build-time injection (npm run build:sw) instead of manual version bumps.");
    process.exit(1);
}

console.log("[check:sw-version] OK: APP_VERSION uses __BUILD_ID__ build-time token.");
