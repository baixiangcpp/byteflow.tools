#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadToolSlugs as loadToolSlugsFromManifests } from "../lib/tool-manifest-lib.js";

const DEFAULT_SCAN_DIRS = [".next/server/app", "out"];
const TRANSLATIONS_DIR = "src/core/i18n/translations";
const BASE_LOCALE = "en";
const ALL_LOCALES = ["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"];
const NON_EN_LOCALES = ALL_LOCALES.filter((locale) => locale !== BASE_LOCALE);

const EXTRA_CRITICAL_PHRASES = [
    "Open menu",
    "Toggle theme",
    "Command Palette",
    "Search for a command to run...",
    "Requires JavaScript. Runs entirely in modern browsers.",
];

// Client-side rendered pages that use translations but have English in SSG snapshot
const CLIENT_RENDERED_PAGE_EXCLUDES = [
];

function parseArgs() {
    const localeIndex = process.argv.indexOf("--locale");
    const locale = localeIndex >= 0 ? process.argv[localeIndex + 1] : null;
    const limitIndex = process.argv.indexOf("--limit");
    const limitRaw = limitIndex >= 0 ? process.argv[limitIndex + 1] : null;
    const limit = limitRaw ? Number(limitRaw) : 200;
    const allPages = process.argv.includes("--all-pages");
    return { locale, limit: Number.isFinite(limit) ? limit : 200, allPages };
}

function resolveScanDir() {
    if (process.env.I18N_RENDER_SCAN_DIR) {
        return process.env.I18N_RENDER_SCAN_DIR;
    }
    for (const dir of DEFAULT_SCAN_DIRS) {
        if (fs.existsSync(dir)) return dir;
    }
    return null;
}

function flattenStringEntries(obj, prefix = "") {
    const entries = [];
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
            entries.push(...flattenStringEntries(value, fullKey));
            continue;
        }
        if (typeof value === "string") {
            entries.push({ key: fullKey, value });
        }
    }
    return entries;
}

function shouldTrackPhrase(key, baseValue) {
    const normalized = baseValue.trim();
    if (normalized.length < 3) return false;
    if (!/[A-Za-z]/.test(normalized)) return false;

    // Skip heavily dynamic strings that are noisy in rendered scans.
    if (normalized.includes("{") || normalized.includes("}")) return false;
    if (normalized.length > 120) return false;

    const hasWhitespace = /\s/.test(normalized);

    if (
        key.startsWith("common.")
        || key.startsWith("nav.")
        || key.startsWith("pages.")
        || key.startsWith("features.")
        || key.startsWith("site.")
    ) {
        // Skip noisy one-word values like "Open", "Input", "Output".
        return hasWhitespace;
    }

    // Tool page heading + description are high-signal for untranslated UI.
    if (/^tools\.[^.]+\.(title|description)$/.test(key)) {
        // One-word technical names (e.g. "UUID") are often intentionally shared.
        return hasWhitespace || normalized.length >= 14;
    }

    return false;
}

function collectLocalePhrases(baseData, localeData) {
    const phraseMap = new Map();
    const baseEntries = flattenStringEntries(baseData);
    const localeEntries = new Map(flattenStringEntries(localeData).map((entry) => [entry.key, entry.value]));

    for (const { key, value: baseValue } of baseEntries) {
        const localizedValue = localeEntries.get(key);
        if (typeof localizedValue !== "string") continue;
        if (localizedValue === baseValue) continue;
        if (!shouldTrackPhrase(key, baseValue)) continue;

        const phrase = baseValue.trim();
        if (localizedValue.toLowerCase().includes(phrase.toLowerCase())) continue;
        if (!phraseMap.has(phrase)) {
            phraseMap.set(phrase, new Set());
        }
        phraseMap.get(phrase).add(key);
    }

    for (const phrase of EXTRA_CRITICAL_PHRASES) {
        if (!phraseMap.has(phrase)) {
            phraseMap.set(phrase, new Set(["critical.literal"]));
        }
    }

    return phraseMap;
}

function walkHtmlFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkHtmlFiles(fullPath));
            continue;
        }
        if (entry.isFile() && entry.name.endsWith(".html")) {
            // Skip client-rendered pages that have English in SSG snapshot
            if (CLIENT_RENDERED_PAGE_EXCLUDES.includes(entry.name)) {
                continue;
            }
            results.push(fullPath);
        }
    }
    return results;
}

function loadToolSlugs() {
    const result = loadToolSlugsFromManifests();
    if (result.length === 0) {
        throw new Error("[check:rendered-i18n-copy] Failed to parse any tool slug from feature manifests");
    }
    return result;
}

function decodeHtmlEntities(input) {
    return input
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
        .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'");
}

const SEGMENT_BREAK_TAG_PATTERN = [
    "address",
    "article",
    "aside",
    "blockquote",
    "button",
    "caption",
    "dd",
    "details",
    "dialog",
    "div",
    "dl",
    "dt",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h[1-6]",
    "header",
    "hr",
    "li",
    "main",
    "nav",
    "ol",
    "p",
    "pre",
    "section",
    "summary",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul",
    "a",
    "label",
    "option",
].join("|");

function extractVisibleTextSegments(html) {
    const stripped = html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(new RegExp(`</(?:${SEGMENT_BREAK_TAG_PATTERN})\\s*>`, "gi"), "\n")
        .replace(/<[^>]+>/g, " ");

    return decodeHtmlEntities(stripped)
        .split(/\n+/)
        .map((segment) => segment.replace(/\s+/g, " ").trim())
        .filter(Boolean);
}

function escapeRegex(source) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesPhrase(text, phrase) {
    const pattern = new RegExp(`(^|[^A-Za-z0-9])${escapeRegex(phrase)}([^A-Za-z0-9]|$)`, "i");
    return text.some((segment) => pattern.test(segment));
}

function relativeFromScan(scanDir, filePath) {
    return path.relative(scanDir, filePath).split(path.sep).join("/");
}

function main() {
    const { locale, limit, allPages } = parseArgs();
    const scanDir = resolveScanDir();
    if (!scanDir) {
        console.error("[check:rendered-i18n-copy] No build output directory found (.next/server/app or out).");
        process.exit(1);
    }

    const targetLocales = locale ? [locale] : NON_EN_LOCALES;
    for (const item of targetLocales) {
        if (!ALL_LOCALES.includes(item)) {
            console.error(`[check:rendered-i18n-copy] Unsupported locale: ${item}`);
            process.exit(1);
        }
    }

    const basePath = path.join(TRANSLATIONS_DIR, `${BASE_LOCALE}.json`);
    if (!fs.existsSync(basePath)) {
        console.error(`[check:rendered-i18n-copy] Missing base translation file: ${basePath}`);
        process.exit(1);
    }
    const baseData = JSON.parse(fs.readFileSync(basePath, "utf8"));

    const failures = [];
    let scannedPages = 0;
    const toolSlugs = allPages ? [] : loadToolSlugs();

    for (const currentLocale of targetLocales) {
        if (currentLocale === BASE_LOCALE) continue;

        const localeFile = path.join(TRANSLATIONS_DIR, `${currentLocale}.json`);
        if (!fs.existsSync(localeFile)) {
            failures.push({
                locale: currentLocale,
                page: "(n/a)",
                phrase: "(missing locale file)",
                keys: ["translations.missing"],
            });
            continue;
        }
        const localeData = JSON.parse(fs.readFileSync(localeFile, "utf8"));
        const phraseMap = collectLocalePhrases(baseData, localeData);
        const localeDir = path.join(scanDir, currentLocale);
        if (!fs.existsSync(localeDir)) {
            failures.push({
                locale: currentLocale,
                page: "(n/a)",
                phrase: "(missing build output)",
                keys: [`missing_dir:${relativeFromScan(scanDir, localeDir)}`],
            });
            continue;
        }

        const htmlFiles = allPages
            ? walkHtmlFiles(localeDir)
            : toolSlugs
                .map((slug) => path.join(localeDir, `${slug}.html`))
                .filter((filePath) => fs.existsSync(filePath));
        for (const htmlFile of htmlFiles) {
            const pageRelPath = relativeFromScan(scanDir, htmlFile);
            const html = fs.readFileSync(htmlFile, "utf8");
            const visibleTextSegments = extractVisibleTextSegments(html);
            scannedPages += 1;

            for (const [phrase, keySet] of phraseMap.entries()) {
                if (!includesPhrase(visibleTextSegments, phrase)) continue;
                failures.push({
                    locale: currentLocale,
                    page: pageRelPath,
                    phrase,
                    keys: Array.from(keySet),
                });
            }
        }
    }

    if (failures.length > 0) {
        console.error(
            `[check:rendered-i18n-copy] Found ${failures.length} potential untranslated English hit(s) across ${scannedPages} rendered page(s).`,
        );
        for (const issue of failures.slice(0, limit)) {
            console.error(`- [${issue.locale}] ${issue.page}`);
            console.error(`  phrase: "${issue.phrase}"`);
            console.error(`  keys: ${issue.keys.join(", ")}`);
        }
        if (failures.length > limit) {
            console.error(`... truncated ${failures.length - limit} additional issue(s). Use --limit to view more.`);
        }
        process.exit(1);
    }

    console.log(
        `[check:rendered-i18n-copy] OK: no tracked English phrases found across ${scannedPages} rendered page(s) for ${targetLocales.join(", ")}`,
    );
}

const isDirectExecution = process.argv[1]
    && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
    main();
}

export {
    extractVisibleTextSegments,
    includesPhrase,
};
