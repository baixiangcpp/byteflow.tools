#!/usr/bin/env node

/**
 * i18n untranslated coverage ratchet
 * - Tracks same-as-en counts per locale against a strict baseline
 * - Supports warn/fail rollout modes
 * - Optional manual/rollout tool; CI/validate enforcement is owned by check:i18n
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isIntentionalSameAsEnglishKey } from "../lib/i18n-shared-copy-lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSLATIONS_DIR = path.join(__dirname, "../../src/core/i18n/translations");
const BASELINE_PATH = path.join(__dirname, "i18n-untranslated-ratchet-baseline.json");
const BASE_LOCALE = "en";
const LOCALES = ["zh-CN", "zh-TW", "ja", "ko", "de", "fr"];

function getArgValue(flagName) {
    const match = process.argv.find((arg) => arg.startsWith(`${flagName}=`));
    if (!match) return null;
    return match.slice(flagName.length + 1).trim();
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

function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeMode(rawMode) {
    if (!rawMode) return null;
    const normalized = rawMode.toLowerCase();
    if (normalized !== "warn" && normalized !== "fail") {
        return null;
    }
    return normalized;
}

const baseline = loadJson(BASELINE_PATH);
const modeFromArg = normalizeMode(getArgValue("--mode"));
const modeFromEnv = normalizeMode(process.env.I18N_RATCHET_MODE);
const modeFromBaseline = normalizeMode(baseline?.rollout?.defaultMode);
const mode = modeFromArg || modeFromEnv || modeFromBaseline || "warn";

const baseData = loadJson(path.join(TRANSLATIONS_DIR, `${BASE_LOCALE}.json`));
const baseStrings = new Map(flattenStringEntries(baseData).map(({ key, value }) => [key, value]));

console.log(`\n[i18n-ratchet] Mode: ${mode}`);
console.log(`[i18n-ratchet] Baseline file: ${path.relative(process.cwd(), BASELINE_PATH)}\n`);

let violations = 0;

for (const locale of LOCALES) {
    const localeData = loadJson(path.join(TRANSLATIONS_DIR, `${locale}.json`));
    const localeStrings = flattenStringEntries(localeData);
    let sameAsEnRaw = 0;
    let sameAsEnEffective = 0;

    for (const { key, value } of localeStrings) {
        const baseValue = baseStrings.get(key);
        if (typeof baseValue === "string" && value === baseValue) {
            sameAsEnRaw += 1;
            if (!isIntentionalSameAsEnglishKey(key, locale)) {
                sameAsEnEffective += 1;
            }
        }
    }

    const max = baseline?.sameAsEnMax?.[locale];
    if (typeof max !== "number") {
        violations += 1;
        console.log(`  - ${locale}: FAIL baseline missing`);
        continue;
    }

    if (sameAsEnEffective > max) {
        violations += 1;
        console.log(`  - ${locale}: FAIL current effective ${sameAsEnEffective} > baseline ${max} (raw ${sameAsEnRaw})`);
    } else {
        const trend = sameAsEnEffective < max ? "improved" : "stable";
        console.log(`  - ${locale}: PASS current effective ${sameAsEnEffective} <= baseline ${max} (${trend}, raw ${sameAsEnRaw})`);
    }
}

console.log("");

if (violations > 0) {
    if (mode === "warn") {
        console.warn(`[i18n-ratchet] WARN: ${violations} locale(s) exceed untranslated baseline`);
        process.exit(0);
    }
    console.error(`[i18n-ratchet] FAILED: ${violations} locale(s) exceed untranslated baseline`);
    process.exit(1);
}

console.log("[i18n-ratchet] PASS: untranslated coverage within ratchet baseline");
process.exit(0);
