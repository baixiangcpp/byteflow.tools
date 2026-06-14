#!/usr/bin/env node

import fs from "node:fs";
import {
    getAllToolOgTargets,
} from "../lib/og-tool-images-lib.js";

const missing = [];

for (const target of getAllToolOgTargets()) {
    if (!fs.existsSync(target.outputPath)) {
        missing.push(target.outputPath);
    }
}

if (missing.length > 0) {
    console.error(`[check:og-tool-images] Missing ${missing.length} tool OG image(s). Run \`npm run generate:og-tool-images\`.`);
    for (const file of missing.slice(0, 40)) {
        console.error(`- ${file}`);
    }
    process.exit(1);
}

console.log("[check:og-tool-images] OK: localized tool OG images are present.");
