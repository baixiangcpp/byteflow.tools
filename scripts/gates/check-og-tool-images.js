#!/usr/bin/env node

import fs from "node:fs";
import {
    findUnexpectedOgImages,
    getAllOgTargets,
    getJpegDimensions,
    MAX_OG_IMAGE_BYTES,
    OG_IMAGE_HEIGHT,
    OG_IMAGE_WIDTH,
} from "../lib/og-tool-images-lib.js";

const missing = [];
const wrongDimensions = [];
const tooLarge = [];
const unexpected = findUnexpectedOgImages();

for (const target of getAllOgTargets()) {
    if (!fs.existsSync(target.outputPath)) {
        missing.push(target.outputPath);
        continue;
    }

    const dimensions = getJpegDimensions(target.outputPath);
    if (!dimensions || dimensions.width !== OG_IMAGE_WIDTH || dimensions.height !== OG_IMAGE_HEIGHT) {
        wrongDimensions.push({
            file: target.outputPath,
            dimensions,
        });
    }

    const size = fs.statSync(target.outputPath).size;
    if (size > MAX_OG_IMAGE_BYTES) {
        tooLarge.push({ file: target.outputPath, size });
    }
}

if (unexpected.length > 0) {
    console.error(`[check:og-tool-images] Found ${unexpected.length} stale or unexpected OG image(s). Remove them or run \`npm run generate:og-tool-images\`.`);
    for (const file of unexpected.slice(0, 40)) {
        console.error(`- ${file}`);
    }
    process.exit(1);
}

if (missing.length > 0) {
    console.error(`[check:og-tool-images] Missing ${missing.length} OG image(s). Run \`npm run generate:og-tool-images\`.`);
    for (const file of missing.slice(0, 40)) {
        console.error(`- ${file}`);
    }
    process.exit(1);
}

if (wrongDimensions.length > 0) {
    console.error(`[check:og-tool-images] ${wrongDimensions.length} OG image(s) have invalid dimensions. Expected ${OG_IMAGE_WIDTH}x${OG_IMAGE_HEIGHT}.`);
    for (const item of wrongDimensions.slice(0, 40)) {
        const actual = item.dimensions ? `${item.dimensions.width}x${item.dimensions.height}` : "unreadable";
        console.error(`- ${item.file}: ${actual}`);
    }
    process.exit(1);
}

if (tooLarge.length > 0) {
    console.error(`[check:og-tool-images] ${tooLarge.length} OG image(s) exceed ${MAX_OG_IMAGE_BYTES} bytes.`);
    for (const item of tooLarge.slice(0, 40)) {
        console.error(`- ${item.file}: ${item.size} bytes`);
    }
    process.exit(1);
}

console.log(`[check:og-tool-images] OK: ${getAllOgTargets().length} localized OG image(s) are present and ${OG_IMAGE_WIDTH}x${OG_IMAGE_HEIGHT}.`);
