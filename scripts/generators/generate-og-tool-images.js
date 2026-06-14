#!/usr/bin/env node

import { chromium } from "playwright";
import {
    ensureOgDirectories,
    getAllToolOgTargets,
    renderToolOgCardHtml,
} from "../lib/og-tool-images-lib.js";

async function run() {
    ensureOgDirectories();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    const targets = getAllToolOgTargets();

    for (const target of targets) {
        await page.setContent(renderToolOgCardHtml(target.card), { waitUntil: "load" });
        await page.screenshot({
            path: target.outputPath,
            type: "jpeg",
            quality: 78,
        });
    }

    await browser.close();
    console.log(`[generate:og-tool-images] OK: generated ${targets.length} localized tool OG image(s).`);
}

run().catch((error) => {
    console.error("[generate:og-tool-images] Failed:", error);
    process.exit(1);
});
