#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import { PWA_BACKGROUND_COLOR } from "../lib/pwa-manifest-lib.js";

const ROOT_DIR = process.cwd();
const SOURCE_ICON_PATH = path.join(ROOT_DIR, "public/icon-512.png");
const OUTPUTS = [
    { size: 192, path: path.join(ROOT_DIR, "public/icon-maskable-192.png") },
    { size: 512, path: path.join(ROOT_DIR, "public/icon-maskable-512.png") },
];
const ICON_SCALE = 0.8;

async function renderMaskableIcon(page, sourceDataUrl, size, outputPath) {
    const pngBase64 = await page.evaluate(
        async ({ backgroundColor, iconScale, source, targetSize }) => {
            const canvas = document.createElement("canvas");
            canvas.width = targetSize;
            canvas.height = targetSize;

            const context = canvas.getContext("2d");
            if (!context) {
                throw new Error("Canvas 2D context is unavailable.");
            }

            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, targetSize, targetSize);

            const image = new Image();
            image.src = source;
            await image.decode();

            const iconSize = Math.round(targetSize * iconScale);
            const offset = Math.round((targetSize - iconSize) / 2);
            context.drawImage(image, offset, offset, iconSize, iconSize);

            return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
        },
        {
            backgroundColor: PWA_BACKGROUND_COLOR,
            iconScale: ICON_SCALE,
            source: sourceDataUrl,
            targetSize: size,
        },
    );

    await fs.writeFile(outputPath, Buffer.from(pngBase64, "base64"));
}

async function main() {
    const source = await fs.readFile(SOURCE_ICON_PATH);
    const sourceDataUrl = `data:image/png;base64,${source.toString("base64")}`;
    const browser = await chromium.launch();

    try {
        const page = await browser.newPage();
        for (const output of OUTPUTS) {
            await renderMaskableIcon(page, sourceDataUrl, output.size, output.path);
            console.log(`[generate:maskable-icons] Wrote ${path.relative(ROOT_DIR, output.path)}`);
        }
    } finally {
        await browser.close();
    }
}

main().catch((error) => {
    console.error(`[generate:maskable-icons] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
