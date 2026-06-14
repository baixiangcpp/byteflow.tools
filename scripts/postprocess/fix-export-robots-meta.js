#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listHtmlFiles } from "../lib/export-html-lang-lib.js";
import { rewriteDuplicateRobotsMeta } from "../lib/export-html-robots-lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");
const OUT_DIR = path.join(ROOT_DIR, "out");

if (!fs.existsSync(OUT_DIR)) {
    console.error(`[fix:export-robots-meta] Build output directory not found: ${OUT_DIR}`);
    process.exit(1);
}

let updatedCount = 0;

for (const filePath of listHtmlFiles(OUT_DIR)) {
    const html = fs.readFileSync(filePath, "utf8");
    const rewritten = rewriteDuplicateRobotsMeta(html);
    if (rewritten === html) {
        continue;
    }

    fs.writeFileSync(filePath, rewritten, "utf8");
    updatedCount += 1;
}

console.log(`[fix:export-robots-meta] OK: updated ${updatedCount} HTML file(s) in ${OUT_DIR}`);
