#!/usr/bin/env node

import fs from "node:fs";
import { execSync } from "node:child_process";
import { MANIFEST_PATH, buildSitemapLastmodManifest } from "../lib/sitemap-lastmod-lib.js";

function stableSerialize(value) {
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
    }

    if (value && typeof value === "object") {
        const keys = Object.keys(value).sort();
        return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
    }

    return JSON.stringify(value);
}

if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`[check:sitemap-lastmod] FAILED: missing ${MANIFEST_PATH}`);
    console.error("[check:sitemap-lastmod] Run: npm run generate:sitemap-lastmod");
    process.exit(1);
}

const committedManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const expectedManifest = buildSitemapLastmodManifest();

function isShallowRepository() {
    try {
        return execSync("git rev-parse --is-shallow-repository", {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        })
            .trim()
            .toLowerCase() === "true";
    } catch {
        return false;
    }
}

function isCloudflarePages() {
    return process.env.CF_PAGES === "1";
}

if (stableSerialize(committedManifest) !== stableSerialize(expectedManifest)) {
    const shallow = isShallowRepository();
    if (shallow && isCloudflarePages()) {
        console.warn("[check:sitemap-lastmod] WARN: shallow git history detected on Cloudflare Pages.");
        console.warn("[check:sitemap-lastmod] WARN: skipping strict lastmod comparison in this environment.");
        console.warn("[check:sitemap-lastmod] WARN: GitHub CI remains the source of strict enforcement.");
        process.exit(0);
    }

    console.error("[check:sitemap-lastmod] FAILED: sitemap lastmod manifest is stale.");
    if (shallow) {
        console.error("[check:sitemap-lastmod] INFO: shallow git history detected.");
        console.error("[check:sitemap-lastmod] INFO: In CI, use actions/checkout with fetch-depth: 0.");
    }
    console.error("[check:sitemap-lastmod] Run: npm run generate:sitemap-lastmod");
    process.exit(1);
}

console.log(`[check:sitemap-lastmod] OK: ${MANIFEST_PATH} is up to date.`);
