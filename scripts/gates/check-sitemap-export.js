#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, "../..")
const OUT_DIR = path.join(ROOT_DIR, "out")
const SITEMAP_PATH = path.join(OUT_DIR, "sitemap.xml")
const REPORT_PATH = path.join(OUT_DIR, "sitemap-audit-report.json")
const BASE_URL = "https://byteflow.tools"
const LOCALES = ["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"]
const LOCALE_SET = new Set(LOCALES)
const NOINDEX_STATIC_SLUGS = new Set(["about", "pricing", "terms"])
const LEGACY_REDIRECTS = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "src/core/routing/legacy-taxonomy-redirects.json"), "utf8"))
const LEGACY_SLUGS = new Set(Object.keys(LEGACY_REDIRECTS))

function readText(filePath) {
    return fs.readFileSync(filePath, "utf8")
}

function decodeXmlAttribute(value) {
    return value
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
}

function extractTags(source, tagName) {
    return [...source.matchAll(new RegExp(`<${tagName}\\b[\\s\\S]*?</${tagName}>`, "gi"))].map((match) => match[0])
}

function extractAttribute(tag, attribute) {
    const match = tag.match(new RegExp(`\\b${attribute}=["']([^"']+)["']`, "i"))
    return match ? decodeXmlAttribute(match[1]) : null
}

function parseSitemap(sitemapXml) {
    return extractTags(sitemapXml, "url").map((urlBlock) => {
        const loc = urlBlock.match(/<loc>([\s\S]*?)<\/loc>/i)?.[1]?.trim()
        const alternates = new Map()
        for (const linkTag of [...urlBlock.matchAll(/<xhtml:link\b[^>]*>/gi)].map((match) => match[0])) {
            const hreflang = extractAttribute(linkTag, "hreflang")
            const href = extractAttribute(linkTag, "href")
            if (hreflang && href) alternates.set(hreflang, href)
        }
        return {
            url: loc ? decodeXmlAttribute(loc) : "",
            alternates,
        }
    })
}

function parseRouteFromUrl(rawUrl) {
    const url = new URL(rawUrl)
    const pathname = url.pathname.replace(/\/+$/, "")
    if (url.origin !== BASE_URL) {
        return { valid: false, reason: `wrong origin: ${url.origin}` }
    }
    if (url.search || url.hash) {
        return { valid: false, reason: "parameterized URL" }
    }
    if (pathname === "") {
        return { valid: true, locale: "en", slug: null, pathname: "/" }
    }

    const segments = pathname.split("/").filter(Boolean)
    const locale = segments[0]
    if (!LOCALE_SET.has(locale)) {
        return { valid: false, reason: `unsupported locale segment: ${locale || "(none)"}` }
    }
    return {
        valid: true,
        locale,
        slug: segments.slice(1).join("/") || null,
        pathname,
    }
}

function expectedCanonical(locale, slug) {
    if (!slug) return locale === "en" ? BASE_URL : `${BASE_URL}/${locale}`
    return `${BASE_URL}/${locale}/${slug}`
}

function expectedAlternates(slug) {
    const alternates = new Map()
    for (const locale of LOCALES) {
        alternates.set(locale, expectedCanonical(locale, slug))
    }
    alternates.set("x-default", slug ? `${BASE_URL}/en/${slug}` : BASE_URL)
    return alternates
}

function htmlPathForRoute(route) {
    if (route.pathname === "/") return path.join(OUT_DIR, "index.html")
    return path.join(OUT_DIR, `${route.pathname.slice(1)}.html`)
}

function extractCanonicalHrefs(html) {
    return [...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi)]
        .map((match) => extractAttribute(match[0], "href"))
        .filter(Boolean)
}

function extractRobotsMeta(html) {
    return [...html.matchAll(/<meta\b[^>]*\bname=["']robots["'][^>]*>/gi)]
        .map((match) => extractAttribute(match[0], "content") || "")
}

function extractHtmlAlternates(html) {
    const alternates = new Map()
    const duplicates = []
    for (const linkTag of [...html.matchAll(/<link\b[^>]*\brel=["']alternate["'][^>]*>/gi)].map((match) => match[0])) {
        const hreflang = extractAttribute(linkTag, "hrefLang") || extractAttribute(linkTag, "hreflang")
        const href = extractAttribute(linkTag, "href")
        if (!hreflang || !href) continue
        if (alternates.has(hreflang)) {
            duplicates.push(hreflang)
            continue
        }
        alternates.set(hreflang, href)
    }
    return { alternates, duplicates }
}

function assertAlternateSet(actual, expected, context, failures) {
    for (const [hreflang, expectedHref] of expected.entries()) {
        const actualHref = actual.get(hreflang)
        if (!actualHref) {
            failures.push(`${context}: missing hreflang ${hreflang}`)
            continue
        }
        if (actualHref !== expectedHref) {
            failures.push(`${context}: hreflang ${hreflang} mismatch (expected ${expectedHref}, got ${actualHref})`)
        }
    }
}

function auditSitemap() {
    if (!fs.existsSync(SITEMAP_PATH)) {
        throw new Error(`Build output sitemap not found: ${SITEMAP_PATH}`)
    }

    const entries = parseSitemap(readText(SITEMAP_PATH))
    const failures = []
    const seen = new Set()
    const localeCounts = Object.fromEntries(LOCALES.map((locale) => [locale, 0]))
    const slugCounts = new Map()

    for (const entry of entries) {
        if (!entry.url) {
            failures.push("sitemap entry missing loc")
            continue
        }
        if (seen.has(entry.url)) {
            failures.push(`${entry.url}: duplicate sitemap URL`)
            continue
        }
        seen.add(entry.url)

        let route
        try {
            route = parseRouteFromUrl(entry.url)
        } catch {
            failures.push(`${entry.url}: invalid URL`)
            continue
        }
        if (!route.valid) {
            failures.push(`${entry.url}: ${route.reason}`)
            continue
        }

        if (route.slug && LEGACY_SLUGS.has(route.slug)) {
            failures.push(`${entry.url}: legacy taxonomy URL is not sitemap eligible`)
        }
        if (route.slug && NOINDEX_STATIC_SLUGS.has(route.slug)) {
            failures.push(`${entry.url}: noindex static page is not sitemap eligible`)
        }

        const htmlPath = htmlPathForRoute(route)
        if (!fs.existsSync(htmlPath)) {
            failures.push(`${entry.url}: missing exported HTML file ${path.relative(ROOT_DIR, htmlPath)}`)
            continue
        }

        const html = readText(htmlPath)
        const expectedUrl = expectedCanonical(route.locale, route.slug)
        if (entry.url.replace(/\/$/, "") !== expectedUrl) {
            failures.push(`${entry.url}: sitemap loc is not expected canonical ${expectedUrl}`)
        }

        const canonicals = extractCanonicalHrefs(html)
        if (canonicals.length !== 1) {
            failures.push(`${entry.url}: expected one canonical tag, found ${canonicals.length}`)
        } else if (canonicals[0] !== expectedUrl) {
            failures.push(`${entry.url}: canonical mismatch (expected ${expectedUrl}, got ${canonicals[0]})`)
        }

        const robots = extractRobotsMeta(html).join(",").toLowerCase()
        if (robots.includes("noindex")) {
            failures.push(`${entry.url}: exported page is noindex`)
        }

        const expectedHreflangs = expectedAlternates(route.slug)
        assertAlternateSet(entry.alternates, expectedHreflangs, `${entry.url} sitemap`, failures)
        const htmlAlternates = extractHtmlAlternates(html)
        if (htmlAlternates.duplicates.length > 0) {
            failures.push(`${entry.url}: duplicate HTML hreflang values ${htmlAlternates.duplicates.join(", ")}`)
        }
        assertAlternateSet(htmlAlternates.alternates, expectedHreflangs, `${entry.url} HTML`, failures)

        localeCounts[route.locale] += 1
        const slugKey = route.slug ?? "(home)"
        slugCounts.set(slugKey, (slugCounts.get(slugKey) ?? 0) + 1)
    }

    return {
        checkedAt: new Date().toISOString(),
        sitemapPath: path.relative(ROOT_DIR, SITEMAP_PATH),
        totalUrls: entries.length,
        localeCounts,
        uniqueSlugCount: slugCounts.size,
        exclusions: {
            legacyTaxonomySlugs: [...LEGACY_SLUGS].sort(),
            noindexStaticSlugs: [...NOINDEX_STATIC_SLUGS].sort(),
            parameterizedUrlsAllowed: false,
        },
        failures,
    }
}

const report = auditSitemap()
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`)

if (report.failures.length > 0) {
    console.error(`[check:sitemap-export] ${report.failures.length} issue(s) found. Report: ${path.relative(ROOT_DIR, REPORT_PATH)}`)
    for (const failure of report.failures.slice(0, 80)) {
        console.error(`- ${failure}`)
    }
    if (report.failures.length > 80) {
        console.error(`- ... ${report.failures.length - 80} more`)
    }
    process.exit(1)
}

console.log(
    `[check:sitemap-export] OK: ${report.totalUrls} sitemap URL(s), ${report.uniqueSlugCount} unique slug(s). Report: ${path.relative(ROOT_DIR, REPORT_PATH)}`,
)
