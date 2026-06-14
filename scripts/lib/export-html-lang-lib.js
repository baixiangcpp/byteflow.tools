import fs from "node:fs";
import path from "node:path";

const DEFAULT_LANG = "en";
const HTML_TAG_PATTERN = /<html\b([^>]*)>/i;
const LANG_ATTR_PATTERN = /\blang=(["'])([^"']*)\1/i;

export function getSupportedLocales(rootDir) {
    const translationsDir = path.join(rootDir, "src/core/i18n/translations");
    return fs
        .readdirSync(translationsDir)
        .filter((entry) => entry.endsWith(".json"))
        .map((entry) => path.basename(entry, ".json"))
        .sort();
}

export function listHtmlFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return listHtmlFiles(fullPath);
        }
        if (entry.isFile() && entry.name.endsWith(".html")) {
            return [fullPath];
        }
        return [];
    });
}

export function resolveExpectedHtmlLang(relativePath, locales, defaultLang = DEFAULT_LANG) {
    const normalizedPath = relativePath.replace(/\\/g, "/");
    const [firstSegment] = normalizedPath.split("/");
    if (!firstSegment) return defaultLang;

    if (firstSegment.endsWith(".html")) {
        const htmlName = firstSegment.slice(0, -".html".length);
        return locales.includes(htmlName) ? htmlName : defaultLang;
    }

    return locales.includes(firstSegment) ? firstSegment : defaultLang;
}

export function extractHtmlLang(html) {
    const htmlTag = html.match(HTML_TAG_PATTERN);
    if (!htmlTag) return null;
    const attrs = htmlTag[1] ?? "";
    const langAttr = attrs.match(LANG_ATTR_PATTERN);
    return langAttr?.[2] ?? null;
}

export function rewriteHtmlLang(html, expectedLang) {
    return html.replace(HTML_TAG_PATTERN, (match, attrs = "") => {
        if (LANG_ATTR_PATTERN.test(attrs)) {
            return `<html${attrs.replace(LANG_ATTR_PATTERN, `lang="${expectedLang}"`)}>`;
        }
        return `<html${attrs} lang="${expectedLang}">`;
    });
}
