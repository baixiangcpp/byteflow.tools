#!/usr/bin/env node

/**
 * i18n Validation Script
 * - Checks missing/empty/extra keys against en.json
 * - Checks code-referenced keys exist in every locale
 * - Checks suspicious placeholder and accent-loss corruption patterns
 * - Blocks Latin transliteration in protected non-Latin locale copy blocks
 * - Reports both raw and effective same-as-en counters
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isIntentionalSameAsEnglishKey } from "../lib/i18n-shared-copy-lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TRANSLATIONS_DIR = path.join(__dirname, "../../src/core/i18n/translations");
const SRC_DIR = path.join(__dirname, "../../src");
const BASE_LOCALE = "en";
const LOCALES = ["zh-CN", "zh-TW", "ja", "ko", "de", "fr"];
const ALL_LOCALES = [BASE_LOCALE, ...LOCALES];
const SUSPICIOUS_PLACEHOLDER_PATTERN = /\?{2,}|\uFFFD/;
const ACCENT_LOSS_PATTERN = /[A-Za-zÀ-ÿ]\?[A-Za-zÀ-ÿ]/;
const NON_LATIN_TOOL_METADATA_PATTERN = /^tools\.[^.]+\.(title|description)$/;
const NON_LATIN_TRANSLITERATION_GUARDS = {
    "zh-CN": {
        scriptPattern: /[\u3400-\u9FFF]/,
        protectedPrefixes: ["pages."],
        requireScriptKeyPatterns: [/^site\./, /^nav\./, /^features\./, /^common\./, /^pages\./, NON_LATIN_TOOL_METADATA_PATTERN],
    },
    "zh-TW": {
        scriptPattern: /[\u3400-\u9FFF]/,
        protectedPrefixes: ["pages."],
        requireScriptKeyPatterns: [/^site\./, /^nav\./, /^features\./, /^common\./, /^pages\./, NON_LATIN_TOOL_METADATA_PATTERN],
    },
    ja: {
        scriptPattern: /[\u3040-\u30FF\u3400-\u9FFF]/,
        protectedPrefixes: ["pages."],
        requireScriptKeyPatterns: [/^site\./, /^nav\./, /^features\./, /^common\./, /^pages\./, NON_LATIN_TOOL_METADATA_PATTERN],
    },
    ko: {
        scriptPattern: /[\uAC00-\uD7AF]/,
        protectedPrefixes: ["pages."],
        requireScriptKeyPatterns: [/^site\./, /^nav\./, /^features\./, /^common\./, /^pages\./, NON_LATIN_TOOL_METADATA_PATTERN],
    },
};
const MANDATORY_LOCALIZED_KEYS = [
    "common.input",
    "common.output",
    "common.format",
    "common.minify",
    "common.copied",
    "common.copied_desc",
    "tools.lorem_ipsum.copy_output",
    "tools.json_formatter.view_text",
    "tools.json_formatter.view_tree",
    "tools.json_formatter.tree_hint",
    "tools.json_formatter.tree_empty",
    "tools.html_css_beautifier.format_css",
    "tools.html_css_beautifier.options_button",
    "tools.html_css_beautifier.options_title",
    "tools.html_css_beautifier.options_desc",
    "tools.html_css_beautifier.indent_size",
    "tools.html_css_beautifier.selector_separator_newline",
    "tools.html_css_beautifier.newline_between_rules",
    "tools.html_css_beautifier.space_around_combinator",
    "tools.html_css_beautifier.end_with_newline",
    "tools.html_css_beautifier.download_css",
    "tools.html_css_beautifier.download_css_success",
    "tools.html_css_beautifier.format_html",
    "tools.html_css_beautifier.download_html",
    "tools.html_css_beautifier.download_html_success",
];
const TOOL_METADATA_EN_ALLOWLIST = new Set([
    // Add tool keys here only if the English title/description is intentionally identical across locales.
]);
function flattenKeys(obj, prefix = "") {
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            keys.push(...flattenKeys(value, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

function flattenStringEntries(obj, prefix = "") {
    const entries = [];
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            entries.push(...flattenStringEntries(value, fullKey));
        } else if (typeof value === "string") {
            entries.push({ key: fullKey, value });
        }
    }
    return entries;
}

function getNestedValue(obj, keyPath) {
    return keyPath.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
}

function walkFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkFiles(fullPath));
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

function collectRegexMatches(fileContents, regex, mapFn = (m) => m[1]) {
    const matches = new Set();
    for (const source of fileContents) {
        for (const match of source.matchAll(regex)) {
            const key = mapFn(match);
            if (key) matches.add(key);
        }
    }
    return matches;
}

function collectToolAliasKeys(fileContents) {
    const matches = new Set();

    for (const source of fileContents) {
        const aliasMap = new Map();

        for (const match of source.matchAll(/const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*t\.tools\??\.\[['"]([a-zA-Z0-9_]+)['"]\]/g)) {
            aliasMap.set(match[1], match[2]);
        }

        for (const [alias, toolKey] of aliasMap.entries()) {
            const dotRegex = new RegExp(`${alias}(?:\\?\\.|\\.)([a-zA-Z0-9_]+)`, "g");
            const bracketRegex = new RegExp(`${alias}(?:\\?\\.|\\.)\\[['"]([a-zA-Z0-9_]+)['"]\\]`, "g");

            for (const m of source.matchAll(dotRegex)) {
                matches.add(`tools.${toolKey}.${m[1]}`);
            }
            for (const m of source.matchAll(bracketRegex)) {
                matches.add(`tools.${toolKey}.${m[1]}`);
            }
        }
    }

    return matches;
}

const sourceFiles = walkFiles(SRC_DIR);
const sourceContents = sourceFiles.map((file) => fs.readFileSync(file, "utf8"));

const localeDataMap = Object.fromEntries(
    ALL_LOCALES.map((locale) => [locale, JSON.parse(fs.readFileSync(path.join(TRANSLATIONS_DIR, `${locale}.json`), "utf8"))])
);

const baseData = localeDataMap[BASE_LOCALE];
const baseKeys = flattenKeys(baseData);
const baseStrings = new Map(flattenStringEntries(baseData).map(({ key, value }) => [key, value]));

let totalMissing = 0;
let totalEmpty = 0;
let totalExtra = 0;
let totalSuspicious = 0;
let totalAccentLoss = 0;
let totalLatinTransliteration = 0;
let totalToolMetaUntranslated = 0;
let totalMandatoryLocalizedFailures = 0;
let totalUnexpectedSharedCopy = 0;
const sameAsEnRawByLocale = {};
const sameAsEnEffectiveByLocale = {};

console.log(`\n[i18n] Checking ${LOCALES.length} locales against ${BASE_LOCALE}.json (${baseKeys.length} keys)\n`);

for (const locale of LOCALES) {
    const localeData = localeDataMap[locale];
    const missing = [];
    const empty = [];
    const extra = [];
    const suspicious = [];
    const accentLoss = [];
    const latinTransliteration = [];
    const untranslatedToolMeta = [];
    const mandatoryLocalizedFailures = [];
    const unexpectedSharedCopy = [];
    let sameAsEnRaw = 0;
    let sameAsEnEffective = 0;

    for (const key of baseKeys) {
        const value = getNestedValue(localeData, key);
        if (value === undefined) {
            missing.push(key);
            continue;
        }

        if (typeof value === "string") {
            if (value.trim() === "") {
                empty.push(key);
            }

            const baseValue = baseStrings.get(key);
            if (typeof baseValue === "string" && value === baseValue) {
                sameAsEnRaw += 1;
                if (!isIntentionalSameAsEnglishKey(key, locale)) {
                    sameAsEnEffective += 1;
                    unexpectedSharedCopy.push(key);
                }
            }
        }
    }

    for (const key of flattenKeys(localeData)) {
        if (getNestedValue(baseData, key) === undefined) {
            extra.push(key);
        }
    }

    for (const { key, value } of flattenStringEntries(localeData)) {
        if (SUSPICIOUS_PLACEHOLDER_PATTERN.test(value)) {
            suspicious.push({ key, value });
        }
        if (ACCENT_LOSS_PATTERN.test(value)) {
            accentLoss.push({ key, value });
        }

        const transliterationGuard = NON_LATIN_TRANSLITERATION_GUARDS[locale];
        if (!transliterationGuard) continue;
        const requiresScript = transliterationGuard
            .requireScriptKeyPatterns
            .some((pattern) => pattern.test(key));
        const isProtectedPrefix = transliterationGuard.protectedPrefixes.some((prefix) => key.startsWith(prefix));
        const isProtectedToolMetadata = NON_LATIN_TOOL_METADATA_PATTERN.test(key);
        if (!requiresScript && !isProtectedPrefix && !isProtectedToolMetadata) continue;

        const normalized = value.trim();
        if (normalized.length === 0) continue;

        if (requiresScript && !transliterationGuard.scriptPattern.test(normalized)) {
            latinTransliteration.push({ key, value });
            continue;
        }

        // For non-Latin locales, tool titles/descriptions must include locale script.
        if (isProtectedToolMetadata && !transliterationGuard.scriptPattern.test(normalized)) {
            latinTransliteration.push({ key, value });
            continue;
        }

        if (!/[A-Za-z]/.test(normalized)) continue;
        if (transliterationGuard.scriptPattern.test(normalized)) continue;

        latinTransliteration.push({ key, value });
    }

    for (const keyPath of MANDATORY_LOCALIZED_KEYS) {
        const baseValue = getNestedValue(baseData, keyPath);
        if (typeof baseValue !== "string") continue;

        const localizedValue = getNestedValue(localeData, keyPath);
        if (typeof localizedValue !== "string" || localizedValue.trim() === "") {
            mandatoryLocalizedFailures.push({ key: keyPath, reason: "missing_or_empty" });
            continue;
        }
        if (localizedValue === baseValue) {
            mandatoryLocalizedFailures.push({ key: keyPath, reason: "same_as_en" });
        }
    }

    const baseTools = (baseData.tools && typeof baseData.tools === "object")
        ? baseData.tools
        : {};
    const localeTools = (localeData.tools && typeof localeData.tools === "object")
        ? localeData.tools
        : {};

    for (const [toolKey, baseToolValue] of Object.entries(baseTools)) {
        if (TOOL_METADATA_EN_ALLOWLIST.has(toolKey)) continue;
        if (!baseToolValue || typeof baseToolValue !== "object") continue;

        const baseTool = baseToolValue;
        const localeTool = localeTools[toolKey];
        if (!localeTool || typeof localeTool !== "object") continue;

        if (typeof baseTool.title !== "string" || typeof baseTool.description !== "string") continue;
        if (typeof localeTool.title !== "string" || typeof localeTool.description !== "string") continue;

        if (localeTool.title === baseTool.title && localeTool.description === baseTool.description) {
            untranslatedToolMeta.push(toolKey);
        }
    }

    sameAsEnRawByLocale[locale] = sameAsEnRaw;
    sameAsEnEffectiveByLocale[locale] = sameAsEnEffective;

    if (
        missing.length === 0
        && empty.length === 0
        && extra.length === 0
        && suspicious.length === 0
        && accentLoss.length === 0
        && latinTransliteration.length === 0
        && untranslatedToolMeta.length === 0
        && mandatoryLocalizedFailures.length === 0
        && unexpectedSharedCopy.length === 0
    ) {
        console.log(`  PASS ${locale}.json (same-as-en raw: ${sameAsEnRaw}, effective: ${sameAsEnEffective})`);
    } else {
        console.log(`  FAIL ${locale}.json`);
        if (missing.length > 0) {
            console.log(`    missing keys: ${missing.length}`);
            missing.forEach((k) => console.log(`      - ${k}`));
        }
        if (empty.length > 0) {
            console.log(`    empty values: ${empty.length}`);
            empty.forEach((k) => console.log(`      - ${k}`));
        }
        if (extra.length > 0) {
            console.log(`    extra keys: ${extra.length}`);
            extra.forEach((k) => console.log(`      - ${k}`));
        }
        if (suspicious.length > 0) {
            console.log(`    suspicious placeholders: ${suspicious.length}`);
            suspicious.forEach(({ key, value }) => console.log(`      - ${key}: ${value}`));
        }
        if (accentLoss.length > 0) {
            console.log(`    accent-loss corruption: ${accentLoss.length}`);
            accentLoss.forEach(({ key, value }) => console.log(`      - ${key}: ${value}`));
        }
        if (latinTransliteration.length > 0) {
            console.log(`    latin transliteration in protected copy: ${latinTransliteration.length}`);
            latinTransliteration.forEach(({ key, value }) => console.log(`      - ${key}: ${value}`));
        }
        if (untranslatedToolMeta.length > 0) {
            console.log(`    untranslated tool metadata (title+description still English): ${untranslatedToolMeta.length}`);
            untranslatedToolMeta.forEach((toolKey) => console.log(`      - tools.${toolKey}`));
        }
        if (mandatoryLocalizedFailures.length > 0) {
            console.log(`    mandatory localized key failures: ${mandatoryLocalizedFailures.length}`);
            mandatoryLocalizedFailures.forEach(({ key, reason }) => console.log(`      - ${key} (${reason})`));
        }
        if (unexpectedSharedCopy.length > 0) {
            console.log(`    unexpected same-as-en copy keys: ${unexpectedSharedCopy.length}`);
            unexpectedSharedCopy.forEach((key) => console.log(`      - ${key}`));
        }
    }

    totalMissing += missing.length;
    totalEmpty += empty.length;
    totalExtra += extra.length;
    totalSuspicious += suspicious.length;
    totalAccentLoss += accentLoss.length;
    totalLatinTransliteration += latinTransliteration.length;
    totalToolMetaUntranslated += untranslatedToolMeta.length;
    totalMandatoryLocalizedFailures += mandatoryLocalizedFailures.length;
    totalUnexpectedSharedCopy += unexpectedSharedCopy.length;
}

const referencedKeys = new Set([
    ...collectRegexMatches(
        sourceContents,
        /t\.(common|nav|site|pages|categories)\??\.([a-zA-Z0-9_]+)/g,
        (m) => `${m[1]}.${m[2]}`
    ),
    ...collectRegexMatches(
        sourceContents,
        /t\.tools\??\.\[['"]([a-zA-Z0-9_]+)['"]\]\??\.([a-zA-Z0-9_]+)/g,
        (m) => `tools.${m[1]}.${m[2]}`
    ),
    ...collectRegexMatches(
        sourceContents,
        /t\.tools\??\.\[['"]([a-zA-Z0-9_]+)['"]\]\??\.\[['"]([a-zA-Z0-9_]+)['"]\]/g,
        (m) => `tools.${m[1]}.${m[2]}`
    ),
    ...collectToolAliasKeys(sourceContents),
]);

let referencedMissing = 0;
console.log(`\n[i18n] Referenced key check: ${referencedKeys.size} keys used in source\n`);
for (const key of referencedKeys) {
    const missingLocales = ALL_LOCALES.filter((locale) => getNestedValue(localeDataMap[locale], key) === undefined);
    if (missingLocales.length > 0) {
        referencedMissing += 1;
        console.log(`  - ${key} missing in: ${missingLocales.join(", ")}`);
    }
}
if (referencedMissing === 0) {
    console.log("  PASS all code-referenced keys exist in all locales");
}

console.log("\n[i18n] same-as-en counters (unexpected shared copy enforced by check:i18n)\n");
for (const locale of LOCALES) {
    console.log(`  - ${locale}: raw ${sameAsEnRawByLocale[locale]}, effective ${sameAsEnEffectiveByLocale[locale]}`);
}

console.log("");
if (totalMissing > 0) {
    console.error(`[i18n] FAILED: ${totalMissing} missing translation keys`);
    process.exit(1);
}
if (referencedMissing > 0) {
    console.error(`[i18n] FAILED: ${referencedMissing} code-referenced keys missing in at least one locale`);
    process.exit(1);
}
if (totalExtra > 0) {
    console.error(`[i18n] FAILED: ${totalExtra} extra keys not present in ${BASE_LOCALE}.json`);
    process.exit(1);
}
if (totalSuspicious > 0) {
    console.error(`[i18n] FAILED: ${totalSuspicious} suspicious placeholder values found`);
    process.exit(1);
}
if (totalAccentLoss > 0) {
    console.error(`[i18n] FAILED: ${totalAccentLoss} accent-loss corruption values found`);
    process.exit(1);
}
if (totalLatinTransliteration > 0) {
    console.error(`[i18n] FAILED: ${totalLatinTransliteration} latin transliteration value(s) found in protected non-Latin locale copy`);
    process.exit(1);
}
if (totalToolMetaUntranslated > 0) {
    console.error(`[i18n] FAILED: ${totalToolMetaUntranslated} tool metadata entries are still English in non-English locales`);
    process.exit(1);
}
if (totalMandatoryLocalizedFailures > 0) {
    console.error(`[i18n] FAILED: ${totalMandatoryLocalizedFailures} mandatory localized key checks failed`);
    process.exit(1);
}
if (totalUnexpectedSharedCopy > 0) {
    console.error(`[i18n] FAILED: ${totalUnexpectedSharedCopy} unexpected same-as-en copy key(s) found`);
    process.exit(1);
}
if (totalEmpty > 0) {
    console.warn(`[i18n] WARNING: ${totalEmpty} empty translation values`);
    process.exit(0);
}

console.log(`[i18n] PASS: all ${LOCALES.length} locales are consistent and quality gates passed`);
process.exit(0);
