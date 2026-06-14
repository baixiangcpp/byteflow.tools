import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSLATIONS_DIR = path.join(__dirname, "../../src/core/i18n/translations");
const PUBLIC_DIR = path.join(__dirname, "../../public");

export const PWA_MANIFEST_LOCALES = ["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"];
export const PWA_THEME_COLOR = "#0a0a1a";
export const PWA_BACKGROUND_COLOR = "#0a0a1a";

const ICONS = [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
];

const SHORTCUTS = [
    { slug: "json-formatter", key: "json_formatter", fallbackShortName: "JSON" },
    { slug: "jwt-workbench", key: "jwt_workbench", fallbackShortName: "JWT" },
    { slug: "base64-encode-decode", key: "base64_encode_decode", fallbackShortName: "Base64" },
    { slug: "password-generator", key: "password_generator", fallbackShortName: "Password" },
];

const SCREENSHOTS = [
    { src: "/pwa-screenshots/home-en-1280x720.png", sizes: "1280x720", type: "image/png", form_factor: "wide" },
    { src: "/pwa-screenshots/json-formatter-en-1280x720.png", sizes: "1280x720", type: "image/png", form_factor: "wide" },
];

function readTranslation(locale) {
    const filePath = path.join(TRANSLATIONS_DIR, `${locale}.json`);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getShortcutManifestEntry(locale, toolKey, slug, fallbackShortName) {
    const translation = readTranslation(locale);
    const tool = translation.tools?.[toolKey];

    if (!tool?.title || !tool?.description) {
        throw new Error(`[pwa-manifest] Missing tools.${toolKey}.title/description for ${locale}`);
    }

    return {
        name: tool.title,
        short_name: tool.title.length <= 12 ? tool.title : fallbackShortName,
        description: tool.description,
        url: `/${locale}/${slug}`,
    };
}

export function getPwaManifestFilename(locale) {
    return locale === "en" ? "manifest.json" : `manifest.${locale}.json`;
}

export function buildPwaManifest(locale) {
    const translation = readTranslation(locale);

    if (!translation.site?.description) {
        throw new Error(`[pwa-manifest] Missing site.description for ${locale}`);
    }

    return {
        name: "byteflow.tools",
        short_name: "byteflow",
        description: translation.site.description,
        id: `/${locale}?source=pwa`,
        lang: locale,
        start_url: `/${locale}?utm_source=pwa`,
        scope: "/",
        display: "standalone",
        background_color: PWA_BACKGROUND_COLOR,
        theme_color: PWA_THEME_COLOR,
        icons: ICONS,
        shortcuts: SHORTCUTS.map(({ slug, key, fallbackShortName }) =>
            getShortcutManifestEntry(locale, key, slug, fallbackShortName)
        ),
        screenshots: SCREENSHOTS,
        categories: ["developer", "productivity", "utilities"],
    };
}

export function writeAllPwaManifests() {
    for (const locale of PWA_MANIFEST_LOCALES) {
        const manifest = buildPwaManifest(locale);
        const filename = getPwaManifestFilename(locale);
        fs.writeFileSync(path.join(PUBLIC_DIR, filename), `${JSON.stringify(manifest, null, 4)}\n`);
    }
}

export function readManifestFile(locale) {
    const filename = getPwaManifestFilename(locale);
    return fs.readFileSync(path.join(PUBLIC_DIR, filename), "utf8");
}
