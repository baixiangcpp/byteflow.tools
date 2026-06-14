#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { listManifestFiles, loadToolSlugs } from "./tool-manifest-lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");
const ROUTE_GROUPS_PATH = path.join(ROOT_DIR, "src/lib/sitemap-route-groups.json");
const TOOL_REGISTRY_SHARED_FILES = [
    "src/core/registry/categories.ts",
    "src/core/registry/manifests.ts",
    "src/core/registry/registry.ts",
    "src/core/registry/related-tools.ts",
    "src/core/registry/types.ts",
];
const MANIFEST_RELATIVE_PATH = "src/lib/sitemap-lastmod.json";

const LOCALES = ["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"];
const ROUTE_FILE_NAMES = [
    "page.tsx",
    "page.ts",
    "page.jsx",
    "page.js",
    "layout.tsx",
    "layout.ts",
    "layout.jsx",
    "layout.js",
];
const GLOBAL_ROUTE_FILES = ["src/app/layout.tsx", "src/app/[lang]/layout.tsx"];
const DEFAULT_FALLBACK_ISO = "2026-02-25T00:00:00.000Z";

function runGit(args) {
    try {
        return execFileSync("git", args, { cwd: ROOT_DIR, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
        return "";
    }
}

function toLiteralPathSpec(filePath) {
    const normalized = filePath.replace(/\\/g, "/");
    return `:(literal)${normalized}`;
}

export function toUtcDayIso(value) {
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return `${value}T00:00:00.000Z`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())).toISOString();
}

export function resolveTrackedFileLastmod({ committedIso, hasLocalChanges, todayIso }) {
    const normalizedCommitted = toUtcDayIso(committedIso);
    if (hasLocalChanges) {
        return toUtcDayIso(todayIso) ?? normalizedCommitted;
    }
    return normalizedCommitted;
}

function dedupePaths(paths) {
    return Array.from(new Set(paths));
}

const TRACKED_FILES = new Set(
    runGit(["ls-files"])
        .split(/\r?\n/)
        .map((line) => line.trim().replace(/\\/g, "/"))
        .filter(Boolean)
);
const fileLastmodCache = new Map();
const fileDirtyCache = new Map();
const TODAY_ISO = toUtcDayIso(new Date().toISOString()) ?? DEFAULT_FALLBACK_ISO;

function isTrackedFile(filePath) {
    return TRACKED_FILES.has(filePath.replace(/\\/g, "/"));
}

function getTrackedGitIso(filePath) {
    const normalized = filePath.replace(/\\/g, "/");
    if (!isTrackedFile(normalized)) return null;

    if (fileLastmodCache.has(normalized)) {
        return fileLastmodCache.get(normalized);
    }

    const rawIso = runGit(["log", "-1", "--format=%cI", "--", toLiteralPathSpec(normalized)]);
    const iso = toUtcDayIso(rawIso);
    fileLastmodCache.set(normalized, iso);
    return iso;
}

function hasLocalGitChanges(filePath) {
    const normalized = filePath.replace(/\\/g, "/");
    if (!isTrackedFile(normalized)) return false;

    if (fileDirtyCache.has(normalized)) {
        return fileDirtyCache.get(normalized);
    }

    const status = runGit(["status", "--porcelain", "--", toLiteralPathSpec(normalized)]);
    const dirty = status.length > 0;
    fileDirtyCache.set(normalized, dirty);
    return dirty;
}

function getEffectiveTrackedIso(filePath) {
    return resolveTrackedFileLastmod({
        committedIso: getTrackedGitIso(filePath),
        hasLocalChanges: hasLocalGitChanges(filePath),
        todayIso: TODAY_ISO,
    });
}

function selectLatestIso(candidates, fallbackIso) {
    let latest = fallbackIso;
    let latestTime = new Date(fallbackIso).getTime();

    for (const iso of candidates) {
        if (!iso) continue;
        const timestamp = new Date(iso).getTime();
        if (Number.isNaN(timestamp)) continue;
        if (timestamp > latestTime) {
            latest = iso;
            latestTime = timestamp;
        }
    }

    return latest;
}

function getFallbackIso() {
    return DEFAULT_FALLBACK_ISO;
}

function readRouteGroups() {
    return JSON.parse(fs.readFileSync(ROUTE_GROUPS_PATH, "utf8"));
}

function toProjectRelativePath(absolutePath) {
    return path.relative(ROOT_DIR, absolutePath).replace(/\\/g, "/");
}

function getToolMetaTrackedFiles() {
    return [
        ...TOOL_REGISTRY_SHARED_FILES,
        ...listManifestFiles().map((manifestPath) => toProjectRelativePath(manifestPath)),
    ]
        .filter((relativePath) => isTrackedFile(relativePath));
}

function readToolSlugs() {
    return loadToolSlugs();
}

function getRouteFilesForSlug(slug) {
    const base = slug ? `src/app/[lang]/${slug}` : "src/app/[lang]";
    return ROUTE_FILE_NAMES
        .map((name) => `${base}/${name}`)
        .filter((filePath) => isTrackedFile(filePath));
}

function resolveRouteLastmod({ locale, slug, includeToolMeta, fallbackIso }) {
    const paths = dedupePaths([
        ...GLOBAL_ROUTE_FILES,
        ...getRouteFilesForSlug(slug),
        `src/core/i18n/translations/${locale}.json`,
        ...(includeToolMeta ? getToolMetaTrackedFiles() : []),
    ].filter(Boolean));

    const routeIsos = paths.map((filePath) => getEffectiveTrackedIso(filePath));
    return selectLatestIso(routeIsos, fallbackIso);
}

function buildLocaleMap({ slug, includeToolMeta, fallbackIso }) {
    return Object.fromEntries(
        LOCALES.map((locale) => [locale, resolveRouteLastmod({ locale, slug, includeToolMeta, fallbackIso })])
    );
}

export const MANIFEST_PATH = path.join(ROOT_DIR, MANIFEST_RELATIVE_PATH);

export function buildSitemapLastmodManifest() {
    const { hubSlugs, staticSlugs } = readRouteGroups();
    const toolSlugs = readToolSlugs();
    const fallbackIso = getFallbackIso();

    const hubs = Object.fromEntries(
        hubSlugs.map((slug) => [slug, buildLocaleMap({ slug, includeToolMeta: false, fallbackIso })])
    );
    const staticPages = Object.fromEntries(
        staticSlugs.map((slug) => [slug, buildLocaleMap({ slug, includeToolMeta: false, fallbackIso })])
    );
    const tools = Object.fromEntries(
        toolSlugs.map((slug) => [slug, buildLocaleMap({ slug, includeToolMeta: true, fallbackIso })])
    );

    return {
        schemaVersion: 1,
        locales: LOCALES,
        home: buildLocaleMap({ slug: "", includeToolMeta: false, fallbackIso }),
        hubs,
        static: staticPages,
        tools,
    };
}
