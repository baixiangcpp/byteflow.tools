#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_SW_PATH = path.join(__dirname, "../../out/sw.js");
const BUILD_ID_TOKEN = "__BUILD_ID__";

function resolveBuildId() {
    const envBuildId =
        process.env.BUILD_ID ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.GITHUB_SHA;

    if (envBuildId && envBuildId.trim().length > 0) {
        return envBuildId.trim().slice(0, 12);
    }

    try {
        return execSync("git rev-parse --short HEAD", {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
    } catch {
        return `local-${Date.now().toString(36)}`;
    }
}

if (!fs.existsSync(OUTPUT_SW_PATH)) {
    console.error(`[build:sw] FAILED: output service worker not found at ${OUTPUT_SW_PATH}`);
    console.error("[build:sw] Run `npm run build:app` before `npm run build:sw`.");
    process.exit(1);
}

const source = fs.readFileSync(OUTPUT_SW_PATH, "utf8");
if (!source.includes(BUILD_ID_TOKEN)) {
    console.log("[build:sw] INFO: __BUILD_ID__ token not found in out/sw.js, skipping injection.");
    process.exit(0);
}

const buildId = resolveBuildId();
const patched = source.replaceAll(BUILD_ID_TOKEN, buildId);
fs.writeFileSync(OUTPUT_SW_PATH, patched, "utf8");

console.log(`[build:sw] OK: injected build id ${buildId} into out/sw.js`);
