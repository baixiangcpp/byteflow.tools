#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "out");
const CONFIG_PATH = path.join(ROOT, "scripts/gates/performance-budgets.json");
const REQUIRED_ROUTES = ["/", "/en/all-tools", "/en/pipeline-builder", "/en/json-formatter", "/en/markdown-preview", "/en/image-resizer"];
const BUDGET_KEYS = [
    "maxInitialJsGzipBytes",
    "maxInitialJsRawBytes",
    "maxInitialScriptFiles",
    "maxCssGzipBytes",
    "maxCssRawBytes",
    "maxHtmlBytes",
];

function readConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function validateConfig(config) {
    const failures = [];
    if (!Array.isArray(config.routes)) {
        failures.push("performance-budgets.json must contain a routes array.");
        return failures;
    }

    const seen = new Set();
    for (const entry of config.routes) {
        if (!entry || typeof entry !== "object") {
            failures.push("Each route budget must be an object.");
            continue;
        }
        if (typeof entry.route !== "string" || !entry.route.startsWith("/")) {
            failures.push(`Invalid route budget entry: route must be an absolute path.`);
        }
        if (typeof entry.label !== "string" || entry.label.trim().length === 0) {
            failures.push(`${entry.route ?? "(unknown route)"}: label is required.`);
        }
        if (seen.has(entry.route)) {
            failures.push(`${entry.route}: duplicate route budget.`);
        }
        seen.add(entry.route);

        for (const key of BUDGET_KEYS) {
            if (!Number.isInteger(entry[key]) || entry[key] <= 0) {
                failures.push(`${entry.route ?? "(unknown route)"}: ${key} must be a positive integer.`);
            }
        }
        if (entry.maxInitialJsGzipBytes > 500000) {
            failures.push(`${entry.route}: maxInitialJsGzipBytes is too high for a baseline route.`);
        }
        if (entry.maxInitialScriptFiles > 35) {
            failures.push(`${entry.route}: maxInitialScriptFiles is too high for a baseline route.`);
        }
    }

    for (const route of REQUIRED_ROUTES) {
        if (!seen.has(route)) {
            failures.push(`Missing required performance budget route: ${route}.`);
        }
    }

    return failures;
}

function routeHtmlPath(route) {
    if (route === "/") return path.join(OUT_DIR, "index.html");
    const cleanRoute = route.replace(/^\/+/, "");
    const flatPath = path.join(OUT_DIR, `${cleanRoute}.html`);
    const indexPath = path.join(OUT_DIR, cleanRoute, "index.html");
    if (fs.existsSync(flatPath)) return flatPath;
    if (fs.existsSync(indexPath)) return indexPath;
    return flatPath;
}

function getAttribute(tag, name) {
    const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"));
    return match?.[1] ?? "";
}

function assetPathFromUrl(assetUrl) {
    const cleanUrl = assetUrl.split(/[?#]/, 1)[0];
    if (!cleanUrl.startsWith("/_next/static/")) return null;
    return path.join(OUT_DIR, cleanUrl.replace(/^\/+/, ""));
}

function extractInitialAssets(html) {
    const scriptAssets = new Set();
    const cssAssets = new Set();

    for (const match of html.matchAll(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>/gi)) {
        const assetPath = assetPathFromUrl(getAttribute(match[0], "src"));
        if (assetPath) scriptAssets.add(assetPath);
    }

    for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
        const tag = match[0];
        const rel = getAttribute(tag, "rel").toLowerCase();
        const asType = getAttribute(tag, "as").toLowerCase();
        const href = getAttribute(tag, "href");
        const assetPath = assetPathFromUrl(href);
        if (!assetPath) continue;

        if (rel === "stylesheet" && assetPath.endsWith(".css")) {
            cssAssets.add(assetPath);
        }
        if ((rel === "preload" || rel === "modulepreload") && asType === "script") {
            scriptAssets.add(assetPath);
        }
    }

    return {
        scripts: [...scriptAssets].sort(),
        styles: [...cssAssets].sort(),
    };
}

function sumAssets(files) {
    return files.reduce(
        (result, file) => {
            if (!fs.existsSync(file)) {
                result.missing.push(path.relative(ROOT, file).replace(/\\/g, "/"));
                return result;
            }
            const buffer = fs.readFileSync(file);
            result.rawBytes += buffer.length;
            result.gzipBytes += zlib.gzipSync(buffer, { level: 9 }).length;
            return result;
        },
        { rawBytes: 0, gzipBytes: 0, missing: [] },
    );
}

function measureRoute(entry) {
    const htmlPath = routeHtmlPath(entry.route);
    if (!fs.existsSync(htmlPath)) {
        return {
            entry,
            missingHtml: path.relative(ROOT, htmlPath).replace(/\\/g, "/"),
        };
    }

    const html = fs.readFileSync(htmlPath, "utf8");
    const assets = extractInitialAssets(html);
    const js = sumAssets(assets.scripts);
    const css = sumAssets(assets.styles);

    return {
        entry,
        htmlPath,
        htmlBytes: fs.statSync(htmlPath).size,
        scriptFiles: assets.scripts.length,
        cssFiles: assets.styles.length,
        jsRawBytes: js.rawBytes,
        jsGzipBytes: js.gzipBytes,
        cssRawBytes: css.rawBytes,
        cssGzipBytes: css.gzipBytes,
        missingAssets: [...js.missing, ...css.missing],
    };
}

function bytesToKiB(value) {
    return `${(value / 1024).toFixed(1)} KiB`;
}

function formatCell(actual, budget) {
    return `${bytesToKiB(actual)} / ${bytesToKiB(budget)}`;
}

function printReport(measurements) {
    console.log("[check:performance-budget] Route bundle budget report");
    console.log("| Route | JS gzip | JS raw | Scripts | CSS gzip | HTML |");
    console.log("| --- | ---: | ---: | ---: | ---: | ---: |");
    for (const measurement of measurements) {
        const entry = measurement.entry;
        if (measurement.missingHtml) {
            console.log(`| ${entry.route} | missing ${measurement.missingHtml} | - | - | - | - |`);
            continue;
        }
        console.log(
            `| ${entry.route} | ${formatCell(measurement.jsGzipBytes, entry.maxInitialJsGzipBytes)} | ${formatCell(measurement.jsRawBytes, entry.maxInitialJsRawBytes)} | ${measurement.scriptFiles} / ${entry.maxInitialScriptFiles} | ${formatCell(measurement.cssGzipBytes, entry.maxCssGzipBytes)} | ${formatCell(measurement.htmlBytes, entry.maxHtmlBytes)} |`,
        );
    }
}

function collectBudgetFailures(measurement) {
    const entry = measurement.entry;
    const failures = [];
    if (measurement.missingHtml) {
        failures.push(`${entry.route}: missing rendered HTML ${measurement.missingHtml}.`);
        return failures;
    }
    for (const asset of measurement.missingAssets) {
        failures.push(`${entry.route}: missing initial asset ${asset}.`);
    }
    if (measurement.jsGzipBytes > entry.maxInitialJsGzipBytes) {
        failures.push(`${entry.route}: JS gzip ${bytesToKiB(measurement.jsGzipBytes)} exceeds ${bytesToKiB(entry.maxInitialJsGzipBytes)}.`);
    }
    if (measurement.jsRawBytes > entry.maxInitialJsRawBytes) {
        failures.push(`${entry.route}: JS raw ${bytesToKiB(measurement.jsRawBytes)} exceeds ${bytesToKiB(entry.maxInitialJsRawBytes)}.`);
    }
    if (measurement.scriptFiles > entry.maxInitialScriptFiles) {
        failures.push(`${entry.route}: initial script count ${measurement.scriptFiles} exceeds ${entry.maxInitialScriptFiles}.`);
    }
    if (measurement.cssGzipBytes > entry.maxCssGzipBytes) {
        failures.push(`${entry.route}: CSS gzip ${bytesToKiB(measurement.cssGzipBytes)} exceeds ${bytesToKiB(entry.maxCssGzipBytes)}.`);
    }
    if (measurement.cssRawBytes > entry.maxCssRawBytes) {
        failures.push(`${entry.route}: CSS raw ${bytesToKiB(measurement.cssRawBytes)} exceeds ${bytesToKiB(entry.maxCssRawBytes)}.`);
    }
    if (measurement.htmlBytes > entry.maxHtmlBytes) {
        failures.push(`${entry.route}: HTML ${bytesToKiB(measurement.htmlBytes)} exceeds ${bytesToKiB(entry.maxHtmlBytes)}.`);
    }
    return failures;
}

const args = new Set(process.argv.slice(2));
const config = readConfig();
const configFailures = validateConfig(config);

if (configFailures.length > 0) {
    console.error(`[check:performance-budget] FAILED: ${configFailures.length} budget config issue(s).`);
    for (const failure of configFailures) console.error(`- ${failure}`);
    process.exit(1);
}

if (args.has("--check-config") || !args.has("--report")) {
    console.log(`[check:performance-budget] OK: ${config.routes.length} route budget(s) configured.`);
    process.exit(0);
}

if (!fs.existsSync(OUT_DIR)) {
    console.error("[check:performance-budget] FAILED: out/ is missing. Run npm run build:app before the report mode.");
    process.exit(1);
}

const measurements = config.routes.map(measureRoute);
printReport(measurements);

const failures = measurements.flatMap(collectBudgetFailures);
if (failures.length > 0) {
    console.error(`[check:performance-budget] FAILED: ${failures.length} performance budget violation(s).`);
    for (const failure of failures) console.error(`- ${failure}`);
    console.error("[check:performance-budget] Update scripts/gates/performance-budgets.json only when the route growth is intentional and documented in the PR.");
    process.exit(1);
}

console.log(`[check:performance-budget] OK: ${measurements.length} route bundle budget(s) within limits.`);
