import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");
const TOOL_INDEX_PATH = path.join(ROOT_DIR, "src/generated/tool-index.json");
const TRANSLATIONS_DIR = path.join(ROOT_DIR, "src/core/i18n/translations");
const OUTPUT_ROOT = path.join(ROOT_DIR, "public/og");
const TOOL_OUTPUT_ROOT = path.join(OUTPUT_ROOT, "tools");
const DEFAULT_OUTPUT_ROOT = path.join(OUTPUT_ROOT, "default");

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

export function getAllOgTargets() {
    return [
        ...getDefaultOgTargets(),
        ...getAllToolOgTargets(),
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
    }
}
