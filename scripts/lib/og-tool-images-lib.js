import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");
const TOOL_INDEX_PATH = path.join(ROOT_DIR, "src/generated/tool-index.json");
const TRANSLATIONS_DIR = path.join(ROOT_DIR, "src/core/i18n/translations");
const OUTPUT_ROOT = path.join(ROOT_DIR, "public/og");
const TOOL_OUTPUT_ROOT = path.join(OUTPUT_ROOT, "tools");
const PAGE_OUTPUT_ROOT = path.join(OUTPUT_ROOT, "pages");
const DEFAULT_OUTPUT_ROOT = path.join(OUTPUT_ROOT, "default");
const ROUTE_GROUPS_PATH = path.join(ROOT_DIR, "src/lib/sitemap-route-groups.json");
const GROWTH_PAGES_SOURCE_PATH = path.join(ROOT_DIR, "src/core/growth/growth-pages.ts");

export const OG_IMAGE_LOCALES = ["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"];
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const MAX_OG_IMAGE_BYTES = 250_000;

const DEFAULT_CARD_COPY = {
    en: {
        badge: "Privacy-first",
        tagline: "Local-first developer tools",
    },
    "zh-CN": {
        badge: "隐私优先",
        tagline: "本地优先开发者工具",
    },
    "zh-TW": {
        badge: "隱私優先",
        tagline: "本地優先開發者工具",
    },
    ja: {
        badge: "プライバシー重視",
        tagline: "ローカル優先の開発者ツール",
    },
    ko: {
        badge: "개인정보 우선",
        tagline: "로컬 우선 개발자 도구",
    },
    de: {
        badge: "Datenschutzfreundlich",
        tagline: "Lokale Entwickler-Tools",
    },
    fr: {
        badge: "Respect de la vie privée",
        tagline: "Outils développeur locaux",
    },
};

const CATEGORY_LABEL_KEY = {
    formatters: "formatters",
    "text-string": "text_string",
    generators: "generators",
    "network-web": "network_web",
};

const PAGE_CATEGORY_COPY = {
    en: {
        hub: "Tool hub",
        workflow: "Workflow",
        comparison: "Comparison",
        alternative: "Alternative",
        howTo: "How-to",
        fix: "Fix guide",
        guide: "Developer guide",
        static: "byteflow.tools",
    },
    "zh-CN": {
        hub: "工具导航",
        workflow: "工作流",
        comparison: "对比",
        alternative: "替代方案",
        howTo: "操作指南",
        fix: "修复指南",
        guide: "开发指南",
        static: "byteflow.tools",
    },
    "zh-TW": {
        hub: "工具導航",
        workflow: "工作流程",
        comparison: "比較",
        alternative: "替代方案",
        howTo: "操作指南",
        fix: "修復指南",
        guide: "開發指南",
        static: "byteflow.tools",
    },
    ja: {
        hub: "ツールハブ",
        workflow: "ワークフロー",
        comparison: "比較",
        alternative: "代替案",
        howTo: "手順ガイド",
        fix: "修正ガイド",
        guide: "開発ガイド",
        static: "byteflow.tools",
    },
    ko: {
        hub: "도구 허브",
        workflow: "워크플로",
        comparison: "비교",
        alternative: "대안",
        howTo: "방법 가이드",
        fix: "해결 가이드",
        guide: "개발 가이드",
        static: "byteflow.tools",
    },
    de: {
        hub: "Tool-Hub",
        workflow: "Workflow",
        comparison: "Vergleich",
        alternative: "Alternative",
        howTo: "Anleitung",
        fix: "Fehlerbehebung",
        guide: "Entwicklerleitfaden",
        static: "byteflow.tools",
    },
    fr: {
        hub: "Hub d'outils",
        workflow: "Workflow",
        comparison: "Comparatif",
        alternative: "Alternative",
        howTo: "Guide pratique",
        fix: "Correction",
        guide: "Guide développeur",
        static: "byteflow.tools",
    },
};

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function clampText(value, maxLength) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function loadToolIndex() {
    return readJson(TOOL_INDEX_PATH).canonicalTools;
}

function loadTranslations(locale) {
    return readJson(path.join(TRANSLATIONS_DIR, `${locale}.json`));
}

function loadRouteGroups() {
    return readJson(ROUTE_GROUPS_PATH);
}

function slugTitle(slug) {
    const lastSegment = slug.split("/").slice(-1)[0];
    return lastSegment
        .split("-")
        .filter(Boolean)
        .map((part) => part.length <= 3 ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`)
        .join(" ");
}

function staticPageCopy(locale, slug) {
    const translation = loadTranslations(locale);
    const pages = translation.pages ?? {};
    const map = {
        "all-tools": { title: translation.site?.root_cta_browse ?? "All tools", description: translation.site?.root_popular_subtitle ?? translation.site?.description },
        about: { title: pages.about_title, description: pages.about_intro },
        pricing: { title: pages.pricing_title, description: pages.pricing_intro },
        contact: { title: pages.contact_title, description: pages.contact_intro },
        privacy: { title: pages.privacy_title, description: pages.privacy_no_collection_desc },
        "trust-center": { title: pages.trust_center_title, description: pages.trust_center_intro },
        roadmap: { title: pages.roadmap_title, description: pages.roadmap_intro },
        changelog: { title: pages.changelog_title, description: pages.changelog_intro },
        "self-hosting": { title: pages.self_hosting_title, description: pages.self_hosting_intro },
        "distribution-research": { title: pages.distribution_research_title, description: pages.distribution_research_intro },
        terms: { title: pages.terms_title, description: pages.terms_use_desc },
        "install-app": { title: pages.install_title ?? "Install byteflow.tools", description: pages.install_intro ?? translation.site?.description },
    };
    return map[slug] ?? null;
}

function pageCategory(locale, slug, hubSlugs) {
    const copy = PAGE_CATEGORY_COPY[locale];
    if (hubSlugs.has(slug)) return copy.hub;
    if (slug.startsWith("workflows/")) return copy.workflow;
    if (slug.startsWith("compare/") || slug === "compare") return copy.comparison;
    if (slug.startsWith("alternatives/") || slug === "alternatives") return copy.alternative;
    if (slug.startsWith("how-to/") || slug === "how-to") return copy.howTo;
    if (slug.startsWith("fix/") || slug === "fix") return copy.fix;
    if (staticPageCopy(locale, slug)) return copy.static;
    return copy.guide;
}

function parsePageCopyFunctionNames() {
    const source = fs.readFileSync(GROWTH_PAGES_SOURCE_PATH, "utf8");
    const names = new Map();
    for (const match of source.matchAll(/slug:\s*"([^"]+)"[\s\S]*?en:\s*([A-Za-z0-9_]+)\(/g)) {
        names.set(match[1], match[2]);
    }
    return names;
}

function getGrowthPageCopy(locale, slug) {
    if (locale !== "en") return null;
    const functionNames = parsePageCopyFunctionNames();
    const functionName = functionNames.get(slug);
    if (!functionName) return null;
    const source = fs.readFileSync(GROWTH_PAGES_SOURCE_PATH, "utf8");
    const start = source.indexOf(`function ${functionName}`);
    if (start < 0) return null;
    const next = source.indexOf("\nfunction ", start + 1);
    const block = source.slice(start, next > start ? next : undefined);
    const title = block.match(/title:\s*"([^"]+)"/)?.[1];
    const description = block.match(/description:\s*"([^"]+)"/)?.[1];
    return title && description ? { title, description } : null;
}

function getPageCardData(locale, slug, hubSlugs) {
    const translation = loadTranslations(locale);
    const navTranslation = translation.nav ?? {};
    const defaultCopy = DEFAULT_CARD_COPY[locale];
    const staticCopy = staticPageCopy(locale, slug);
    const growthCopy = getGrowthPageCopy(locale, slug);
    const navKey = slug.replaceAll("-", "_");
    const title = staticCopy?.title ?? growthCopy?.title ?? navTranslation[navKey] ?? slugTitle(slug);
    const description = staticCopy?.description ?? growthCopy?.description ?? translation.site?.description ?? defaultCopy.tagline;

    return {
        locale,
        slug,
        title: clampText(title, 72),
        description: clampText(description, 180),
        category: pageCategory(locale, slug, hubSlugs),
        tagline: defaultCopy.tagline,
    };
}

function getToolCardData(locale, tool) {
    const translation = loadTranslations(locale);
    const toolTranslation = translation.tools?.[tool.key];
    const navTranslation = translation.nav ?? {};
    const defaultCopy = DEFAULT_CARD_COPY[locale];

    if (!toolTranslation?.title || !toolTranslation?.description) {
        throw new Error(`[og-tool-images] Missing tools.${tool.key}.title/description for ${locale}`);
    }

    return {
        locale,
        slug: tool.slug,
        title: clampText(toolTranslation.title, 72),
        description: clampText(toolTranslation.description, 180),
        category: navTranslation[CATEGORY_LABEL_KEY[tool.category]] ?? tool.category,
        tagline: defaultCopy.tagline,
    };
}

function getDefaultCardData(locale) {
    const translation = loadTranslations(locale);
    const defaultCopy = DEFAULT_CARD_COPY[locale];

    if (!translation.site?.title || !translation.site?.description) {
        throw new Error(`[og-tool-images] Missing site.title/site.description for ${locale}`);
    }

    return {
        locale,
        slug: "default",
        title: clampText(translation.site.title, 72),
        description: clampText(translation.site.description, 180),
        category: defaultCopy.badge,
        tagline: defaultCopy.tagline,
    };
}

export function getToolOgImagePath(locale, slug) {
    return path.join(TOOL_OUTPUT_ROOT, locale, `${slug}.jpg`);
}

export function getToolOgImageUrl(locale, slug) {
    return `https://byteflow.tools/og/tools/${locale}/${slug}.jpg`;
}

export function getDefaultOgImagePath(locale) {
    return path.join(DEFAULT_OUTPUT_ROOT, `${locale}.jpg`);
}

export function getDefaultOgImageUrl(locale) {
    return `https://byteflow.tools/og/default/${locale}.jpg`;
}

export function getPageOgImagePath(locale, slug) {
    return path.join(PAGE_OUTPUT_ROOT, locale, `${slug}.jpg`);
}

export function getPageOgImageUrl(locale, slug) {
    return `https://byteflow.tools/og/pages/${locale}/${slug}.jpg`;
}

export function getDefaultOgTargets() {
    return OG_IMAGE_LOCALES.map((locale) => ({
        locale,
        slug: "default",
        outputPath: getDefaultOgImagePath(locale),
        card: getDefaultCardData(locale),
    }));
}

export function getAllToolOgTargets() {
    return loadToolIndex().flatMap((tool) =>
        OG_IMAGE_LOCALES.map((locale) => ({
            locale,
            slug: tool.slug,
            outputPath: getToolOgImagePath(locale, tool.slug),
            card: getToolCardData(locale, tool),
        }))
    );
}

export function getAllPageOgTargets() {
    const routeGroups = loadRouteGroups();
    const hubSlugs = new Set(routeGroups.hubSlugs);
    const pageSlugs = [...new Set([...routeGroups.hubSlugs, ...routeGroups.staticSlugs])]
        .filter((slug) => slug !== "about" && slug !== "pricing" && slug !== "terms")
        .sort((a, b) => a.localeCompare(b));

    return pageSlugs.flatMap((slug) =>
        OG_IMAGE_LOCALES.map((locale) => ({
            locale,
            slug,
            outputPath: getPageOgImagePath(locale, slug),
            card: getPageCardData(locale, slug, hubSlugs),
        }))
    );
}

export function getAllOgTargets() {
    return [
        ...getDefaultOgTargets(),
        ...getAllToolOgTargets(),
        ...getAllPageOgTargets(),
    ];
}

function walkJpegFiles(dir) {
    if (!fs.existsSync(dir)) return [];

    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkJpegFiles(entryPath));
        } else if (entry.isFile() && entry.name.endsWith(".jpg")) {
            files.push(entryPath);
        }
    }
    return files;
}

export function findUnexpectedOgImages() {
    const expectedPaths = new Set(getAllOgTargets().map((target) => path.resolve(target.outputPath)));
    return walkJpegFiles(OUTPUT_ROOT)
        .filter((filePath) => !expectedPaths.has(path.resolve(filePath)))
        .sort((a, b) => a.localeCompare(b));
}

export function removeUnexpectedOgImages() {
    const unexpectedImages = findUnexpectedOgImages();
    for (const filePath of unexpectedImages) {
        fs.unlinkSync(filePath);
    }
    return unexpectedImages;
}

export function getJpegDimensions(filePath) {
    const buffer = fs.readFileSync(filePath);
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

    let offset = 2;
    while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) {
            offset += 1;
            continue;
        }

        const marker = buffer[offset + 1];
        const length = buffer.readUInt16BE(offset + 2);
        if (marker >= 0xc0 && marker <= 0xc3) {
            return {
                width: buffer.readUInt16BE(offset + 7),
                height: buffer.readUInt16BE(offset + 5),
            };
        }
        offset += 2 + length;
    }

    return null;
}

export function renderOgCardHtml({ locale, category, title, description, tagline }) {
    return `<!doctype html>
<html lang="${escapeHtml(locale)}">
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        color-scheme: dark;
        --bg-a: #07111f;
        --bg-b: #0f2a3d;
        --panel: rgba(10, 21, 36, 0.78);
        --panel-border: rgba(141, 201, 255, 0.18);
        --accent: #69d2ff;
        --accent-2: #8df3c7;
        --text: #f3f7fb;
        --muted: rgba(229, 238, 247, 0.78);
      }

      * { box-sizing: border-box; }
      html, body {
        width: 1200px;
        height: 630px;
        margin: 0;
        overflow: hidden;
        background:
          radial-gradient(circle at top left, rgba(105, 210, 255, 0.20), transparent 34%),
          radial-gradient(circle at bottom right, rgba(141, 243, 199, 0.18), transparent 32%),
          linear-gradient(140deg, var(--bg-a), var(--bg-b));
        font-family: "SF Pro Display", "Segoe UI", "PingFang SC", "Hiragino Sans", "Noto Sans", sans-serif;
        color: var(--text);
      }

      .frame {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 52px;
      }

      .panel {
        position: relative;
        height: 100%;
        border-radius: 36px;
        padding: 44px 48px;
        border: 1px solid var(--panel-border);
        background:
          linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
          var(--panel);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
      }

      .badge-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 28px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border-radius: 999px;
        font-size: 22px;
        font-weight: 600;
        color: var(--text);
        background: rgba(105, 210, 255, 0.12);
        border: 1px solid rgba(105, 210, 255, 0.24);
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: linear-gradient(180deg, var(--accent), var(--accent-2));
      }

      .brand {
        font-size: 20px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(243, 247, 251, 0.72);
      }

      h1 {
        margin: 0;
        max-width: 860px;
        font-size: 66px;
        line-height: 1.04;
        letter-spacing: -0.03em;
      }

      p {
        margin: 24px 0 0;
        max-width: 820px;
        font-size: 30px;
        line-height: 1.35;
        color: var(--muted);
      }

      .footer {
        position: absolute;
        left: 48px;
        right: 48px;
        bottom: 42px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .tagline {
        font-size: 22px;
        color: rgba(243, 247, 251, 0.72);
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        font-size: 20px;
        color: rgba(243, 247, 251, 0.82);
      }
    </style>
  </head>
  <body>
    <div class="frame">
      <div class="panel">
        <div class="badge-row">
          <div class="badge"><span class="dot"></span>${escapeHtml(category)}</div>
          <div class="brand">byteflow.tools</div>
        </div>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        <div class="footer">
          <div class="tagline">${escapeHtml(tagline)}</div>
          <div class="pill">${escapeHtml(locale)}</div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export function renderToolOgCardHtml(card) {
    return renderOgCardHtml(card);
}

export function renderDefaultOgCardHtml(card) {
    return renderOgCardHtml(card);
}

export function ensureOgDirectories() {
    fs.mkdirSync(DEFAULT_OUTPUT_ROOT, { recursive: true });
    for (const locale of OG_IMAGE_LOCALES) {
        fs.mkdirSync(path.join(TOOL_OUTPUT_ROOT, locale), { recursive: true });
        fs.mkdirSync(path.join(PAGE_OUTPUT_ROOT, locale), { recursive: true });
    }
}
