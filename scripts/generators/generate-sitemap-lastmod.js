#!/usr/bin/env node

import fs from "node:fs";
import { MANIFEST_PATH, buildSitemapLastmodManifest } from "../lib/sitemap-lastmod-lib.js";

const nextManifest = buildSitemapLastmodManifest();
const nextJson = `${JSON.stringify(nextManifest, null, 2)}\n`;
const previousJson = fs.existsSync(MANIFEST_PATH) ? fs.readFileSync(MANIFEST_PATH, "utf8") : null;

if (previousJson === nextJson) {
    console.log("[sitemap-lastmod] OK: manifest already up to date.");
    process.exit(0);
}

fs.writeFileSync(MANIFEST_PATH, nextJson, "utf8");

const action = previousJson ? "Updated" : "Created";
console.log(`[sitemap-lastmod] ${action} ${MANIFEST_PATH}`);
console.log(`[sitemap-lastmod] schemaVersion=${nextManifest.schemaVersion}`);
