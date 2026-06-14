#!/usr/bin/env node

import { buildPwaManifest, PWA_MANIFEST_LOCALES, getPwaManifestFilename, readManifestFile } from "../lib/pwa-manifest-lib.js";

const mismatches = [];

for (const locale of PWA_MANIFEST_LOCALES) {
    const expected = `${JSON.stringify(buildPwaManifest(locale), null, 4)}\n`;
    const actual = readManifestFile(locale);
    if (actual !== expected) {
        mismatches.push(getPwaManifestFilename(locale));
    }
}

if (mismatches.length > 0) {
    console.error(`[check:pwa-manifests] Found ${mismatches.length} stale manifest file(s). Run \`npm run generate:pwa-manifests\`.`);
    for (const file of mismatches) {
        console.error(`- ${file}`);
    }
    process.exit(1);
}

console.log("[check:pwa-manifests] OK: localized manifest files are up to date.");
