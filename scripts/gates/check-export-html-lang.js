#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
    extractHtmlLang,
    getSupportedLocales,
    listHtmlFiles,
    resolveExpectedHtmlLang,
} from "../lib/export-html-lang-lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");
const OUT_DIR = path.join(ROOT_DIR, "out");

if (!fs.existsSync(OUT_DIR)) {
    console.error(`[check:export-html-lang] Build output directory not found: ${OUT_DIR}`);
    process.exit(1);
}

const locales = getSupportedLocales(ROOT_DIR);
const htmlFiles = listHtmlFiles(OUT_DIR);
const failures = [];

for (const filePath of htmlFiles) {
    const relativePath = path.relative(OUT_DIR, filePath);
    const expectedLang = resolveExpectedHtmlLang(relativePath, locales);
    const html = fs.readFileSync(filePath, "utf8");
    const actualLang = extractHtmlLang(html);

    if (actualLang !== expectedLang) {
        failures.push(`${relativePath}: expected html lang="${expectedLang}" but found ${actualLang ?? "missing"}`);
    }
}

if (failures.length > 0) {
    console.error(`[check:export-html-lang] ${failures.length} issue(s) found:`);
    for (const failure of failures) {
        console.error(`  - ${failure}`);
    }
    process.exit(1);
}

console.log(`[check:export-html-lang] OK: ${htmlFiles.length} HTML file(s) verified in ${OUT_DIR}`);
