#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listHtmlFiles } from "../lib/export-html-lang-lib.js";
import { extractRobotsMetaContents, hasDuplicateRobotsMeta } from "../lib/export-html-robots-lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");
const OUT_DIR = path.join(ROOT_DIR, "out");

if (!fs.existsSync(OUT_DIR)) {
    console.error(`[check:export-robots-meta] Build output directory not found: ${OUT_DIR}`);
    process.exit(1);
}

const failures = [];

for (const filePath of listHtmlFiles(OUT_DIR)) {
    const html = fs.readFileSync(filePath, "utf8");
    if (!hasDuplicateRobotsMeta(html)) {
        continue;
    }

    const relativePath = path.relative(OUT_DIR, filePath);
    failures.push(`${relativePath}: ${extractRobotsMetaContents(html).join(" | ")}`);
}

if (failures.length > 0) {
    console.error(`[check:export-robots-meta] ${failures.length} issue(s) found:`);
    for (const failure of failures) {
        console.error(`  - ${failure}`);
    }
    process.exit(1);
}

console.log(`[check:export-robots-meta] OK: no duplicate robots meta tags found in ${OUT_DIR}`);
