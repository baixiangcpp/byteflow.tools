#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
    extractHtmlLang,
    getSupportedLocales,
    listHtmlFiles,
    resolveExpectedHtmlLang,
    rewriteHtmlLang,
} from "../lib/export-html-lang-lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");
const OUT_DIR = path.join(ROOT_DIR, "out");

if (!fs.existsSync(OUT_DIR)) {
    console.error(`[fix:export-html-lang] Build output directory not found: ${OUT_DIR}`);
    process.exit(1);
}

const locales = getSupportedLocales(ROOT_DIR);
const htmlFiles = listHtmlFiles(OUT_DIR);
let updatedCount = 0;

for (const filePath of htmlFiles) {
    const relativePath = path.relative(OUT_DIR, filePath);
    const expectedLang = resolveExpectedHtmlLang(relativePath, locales);
    const html = fs.readFileSync(filePath, "utf8");
    const actualLang = extractHtmlLang(html);

    if (actualLang === expectedLang) {
        continue;
    }

    fs.writeFileSync(filePath, rewriteHtmlLang(html, expectedLang), "utf8");
    updatedCount += 1;
}

console.log(`[fix:export-html-lang] OK: updated ${updatedCount} HTML file(s) in ${OUT_DIR}`);
