import fs from "fs"
import path from "path"

const NON_EN_LOCALES = ["zh-CN", "zh-TW", "ja", "ko", "de", "fr"]
const ALLOWLIST_SAME_AS_EN = new Set([
    "/contact.html",
])

function decodeHtml(str) {
    return str
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&#39;", "'")
        .replaceAll("&apos;", "'")
        .replaceAll("&quot;", "\"")
        .trim()
}

function walkHtmlFiles(dir, out = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walkHtmlFiles(fullPath, out)
        } else if (entry.isFile() && fullPath.endsWith(".html")) {
            out.push(fullPath)
        }
    }
    return out
}

function extractMetadata(html) {
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i)
    const descriptionMatch =
        html.match(/<meta[^>]*name=\"description\"[^>]*content=\"([^\"]*)\"[^>]*>/i) ??
        html.match(/<meta[^>]*content=\"([^\"]*)\"[^>]*name=\"description\"[^>]*>/i)
    const keywordsMatch =
        html.match(/<meta[^>]*name=\"keywords\"[^>]*content=\"([^\"]*)\"[^>]*>/i) ??
        html.match(/<meta[^>]*content=\"([^\"]*)\"[^>]*name=\"keywords\"[^>]*>/i)

    return {
        title: decodeHtml(titleMatch?.[1] ?? ""),
        description: decodeHtml(descriptionMatch?.[1] ?? ""),
        keywords: decodeHtml(keywordsMatch?.[1] ?? ""),
    }
}

function run() {
    const appDir = path.join(process.cwd(), ".next", "server", "app")
    if (!fs.existsSync(appDir)) {
        console.error("[check:metadata-localization] Missing .next/server/app. Run `npm run build:app` first.")
        process.exit(1)
    }

    const issues = []

    for (const locale of NON_EN_LOCALES) {
        const localeDir = path.join(appDir, locale)
        if (!fs.existsSync(localeDir)) continue

        for (const htmlFile of walkHtmlFiles(localeDir)) {
            const rel = htmlFile
                .slice(localeDir.length)
                .replaceAll("\\", "/")
            if (ALLOWLIST_SAME_AS_EN.has(rel)) continue

            const enFile = path.join(appDir, "en", rel)
            if (!fs.existsSync(enFile)) continue

            const localized = extractMetadata(fs.readFileSync(htmlFile, "utf8"))
            const english = extractMetadata(fs.readFileSync(enFile, "utf8"))

            if (!localized.title) {
                issues.push({
                    locale,
                    rel,
                    field: "title",
                    value: "(empty)",
                })
            }
            if (!localized.description) {
                issues.push({
                    locale,
                    rel,
                    field: "description",
                    value: "(empty)",
                })
            }
            if (localized.title && localized.title === english.title) {
                issues.push({
                    locale,
                    rel,
                    field: "title",
                    value: localized.title,
                })
            }
            if (localized.description && localized.description === english.description) {
                issues.push({
                    locale,
                    rel,
                    field: "description",
                    value: localized.description,
                })
            }
            if (localized.keywords && localized.keywords === english.keywords) {
                issues.push({
                    locale,
                    rel,
                    field: "keywords",
                    value: localized.keywords,
                })
            }
        }
    }

    if (issues.length === 0) {
        console.log("[check:metadata-localization] OK: all non-en pages have localized title/description/keywords (allowlist excluded).")
        return
    }

    console.error(`[check:metadata-localization] Found ${issues.length} potential untranslated metadata hit(s).`)
    for (const issue of issues.slice(0, 120)) {
        console.error(`- [${issue.locale}] ${issue.rel} (${issue.field}): ${issue.value}`)
    }
    process.exit(1)
}

run()
