#!/usr/bin/env node

import fs from "node:fs";
import { chromium } from "playwright";
import {
    ensureOgDirectories,
    getDefaultOgTargets,
    getAllPageOgTargets,
    getAllToolOgTargets,
    removeUnexpectedOgImages,
    renderDefaultOgCardHtml,
    renderToolOgCardHtml,
} from "../lib/og-tool-images-lib.js";

async function run() {
    ensureOgDirectories();
    const missingOnly = process.argv.includes("--missing-only");
    const removedStaleImages = missingOnly ? [] : removeUnexpectedOgImages();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    const allTargets = [
        ...getDefaultOgTargets().map((target) => ({
            ...target,
            html: renderDefaultOgCardHtml(target.card),
        })),
        ...getAllToolOgTargets().map((target) => ({
            ...target,
            html: renderToolOgCardHtml(target.card),
        })),
        ...getAllPageOgTargets().map((target) => ({
            ...target,
            html: renderDefaultOgCardHtml(target.card),
        })),
    ];
    const targets = missingOnly
        ? allTargets.filter((target) => !fs.existsSync(target.outputPath))
        : allTargets;

    for (const target of targets) {
        await page.setContent(target.html, { waitUntil: "load" });
        await page.screenshot({
            path: target.outputPath,
            type: "jpeg",
            quality: 78,
        });
    }

    await browser.close();
    const staleMessage = removedStaleImages.length > 0 ? ` Removed ${removedStaleImages.length} stale image(s).` : "";
    console.log(`[generate:og-tool-images] OK: generated ${targets.length} localized OG image(s).${staleMessage}`);
}

run().catch((error) => {
    console.error("[generate:og-tool-images] Failed:", error);
    process.exit(1);
});
