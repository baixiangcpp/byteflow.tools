import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import fs from "node:fs"
import sitemap from "@/app/sitemap"
import { LOCALES, type Locale } from "@/core/i18n/i18n"
import { GROWTH_INDEXES, GROWTH_PAGES, GROWTH_UI_COPY, type GrowthPageCopy } from "@/core/growth/growth-pages"
import { getToolByKey } from "@/core/registry"
import { buildCanonicalUrl } from "@/core/seo/urls"
import { GrowthContentPage } from "@/core/seo/components/growth-content-pages"

const LOCALE_SCRIPT_REQUIREMENTS: Partial<Record<Locale, RegExp>> = {
    "zh-CN": /[\u3400-\u9FFF]/,
    "zh-TW": /[\u3400-\u9FFF]/,
    ja: /[\u3040-\u30FF\u3400-\u9FFF]/,
    ko: /[\uAC00-\uD7AF]/,
}

function flattenCopy(copy: GrowthPageCopy): string[] {
    return [
        copy.eyebrow,
        copy.title,
        copy.description,
        copy.intent,
        copy.trustCenterAngle,
        ...copy.summaryPoints,
        ...copy.sections.flatMap((section) => [
            section.heading,
            ...section.body,
            ...(section.bullets ?? []),
        ]),
        ...(copy.comparisonRows ?? []).flatMap((row) => [row.factor, row.byteflow, row.other, row.note]),
        ...(copy.steps ?? []).flatMap((step) => [step.name, step.text]),
        ...copy.faq.flatMap((item) => [item.question, item.answer]),
    ]
}

function collectTypes(value: unknown, out = new Set<string>()) {
    if (Array.isArray(value)) {
        for (const item of value) collectTypes(item, out)
        return out
    }

    if (!value || typeof value !== "object") return out
    const record = value as Record<string, unknown>
    const type = record["@type"]
    if (typeof type === "string") out.add(type)
    if (Array.isArray(type)) {
        for (const item of type) {
            if (typeof item === "string") out.add(item)
        }
    }
    for (const child of Object.values(record)) collectTypes(child, out)
    return out
}

function parseJsonLdBlocks(markup: string) {
    return [...markup.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
        .map((match) => JSON.parse(match[1] ?? "{}") as unknown)
}

describe("BF-028 growth content pages", () => {
    it("documents the repository localization constraint for new user-facing copy", () => {
        const docs = [
            "CONTRIBUTING.md",
            "docs/specs/localization-quality-review.md",
        ].map((file) => fs.readFileSync(file, "utf8")).join("\n")

        expect(docs).toContain("every supported locale has complete, accurate localized text")
        expect(docs).toContain("partial originality is not acceptable")
    })

    it("ships the required first-batch pages", () => {
        expect(GROWTH_PAGES.map((page) => page.slug).sort()).toEqual([
            "alternatives/json-formatter-privacy-first",
            "compare/byteflow-vs-cyberchef",
            "compare/byteflow-vs-jwt-io",
            "compare/md5-vs-sha256",
            "fix/base64-invalid-length",
            "how-to/decode-jwt-locally",
        ])
    })

    it("requires complete localized copy for every growth page and locale", () => {
        for (const page of GROWTH_PAGES) {
            const english = flattenCopy(page.copy.en)
            expect(english.length, page.slug).toBeGreaterThanOrEqual(18)

            for (const locale of LOCALES) {
                const copy = page.copy[locale]
                const values = flattenCopy(copy)

                expect(values.length, `${page.slug} ${locale}`).toBe(english.length)
                expect(values.every((value) => value.trim().length > 0), `${page.slug} ${locale}`).toBe(true)
                expect(copy.summaryPoints.length, `${page.slug} ${locale}`).toBeGreaterThanOrEqual(3)
                expect(copy.sections.length, `${page.slug} ${locale}`).toBeGreaterThanOrEqual(2)
                expect(copy.faq.length, `${page.slug} ${locale}`).toBeGreaterThanOrEqual(2)

                if (locale !== "en") {
                    expect(values, `${page.slug} ${locale} must not reuse English body copy`).not.toEqual(english)
                    expect(copy.title, `${page.slug} ${locale} title`).not.toBe(page.copy.en.title)
                    expect(copy.description, `${page.slug} ${locale} description`).not.toBe(page.copy.en.description)

                    const sharedLongCopy = values.filter((value, index) => value === english[index] && value.length >= 24)
                    expect(sharedLongCopy, `${page.slug} ${locale} must not reuse English narrative copy`).toEqual([])

                    const scriptRequirement = LOCALE_SCRIPT_REQUIREMENTS[locale]
                    if (scriptRequirement) {
                        const longLocalizedValues = values.filter((value) => value.length >= 24)
                        expect(
                            longLocalizedValues.every((value) => scriptRequirement.test(value)),
                            `${page.slug} ${locale} long-form copy must use the locale script`,
                        ).toBe(true)
                    }
                }
            }
        }
    })

    it("requires complete localized index and shared UI copy", () => {
        for (const index of GROWTH_INDEXES) {
            for (const locale of LOCALES) {
                expect(index.eyebrow[locale].trim(), `${index.slug} ${locale} eyebrow`).not.toBe("")
                expect(index.title[locale].trim(), `${index.slug} ${locale} title`).not.toBe("")
                expect(index.description[locale].trim(), `${index.slug} ${locale} description`).not.toBe("")
                if (locale !== "en") {
                    expect(index.title[locale], `${index.slug} ${locale} title`).not.toBe(index.title.en)
                    expect(index.description[locale], `${index.slug} ${locale} description`).not.toBe(index.description.en)
                }
            }
        }

        for (const locale of LOCALES) {
            const ui = GROWTH_UI_COPY[locale]
            expect(ui.keyTakeaways.trim()).not.toBe("")
            expect(ui.toolsInWorkflowDescription.trim()).not.toBe("")
            expect(ui.toolCount(2).trim()).not.toBe("")
            if (locale !== "en") {
                expect(ui.keyTakeaways).not.toBe(GROWTH_UI_COPY.en.keyTakeaways)
                expect(ui.toolsInWorkflowDescription).not.toBe(GROWTH_UI_COPY.en.toolsInWorkflowDescription)
            }
        }
    })

    it("links every page to real related tools and Trust Center", () => {
        for (const page of GROWTH_PAGES) {
            expect(page.relatedToolKeys.length, page.slug).toBeGreaterThanOrEqual(2)
            for (const toolKey of page.relatedToolKeys) {
                expect(getToolByKey(toolKey), `${page.slug} ${toolKey}`).toBeTruthy()
            }

            const markup = renderToStaticMarkup(<GrowthContentPage locale="en" slug={page.slug} />)
            expect(markup).toContain("/en/trust-center")
            for (const toolKey of page.relatedToolKeys) {
                const tool = getToolByKey(toolKey)
                expect(markup).toContain(`/en/${tool?.slug}`)
            }
        }
    })

    it("renders matching Article or HowTo, BreadcrumbList, and FAQPage JSON-LD", () => {
        for (const page of GROWTH_PAGES) {
            const markup = renderToStaticMarkup(<GrowthContentPage locale="en" slug={page.slug} />)
            const types = collectTypes(parseJsonLdBlocks(markup))

            expect(types.has("BreadcrumbList"), page.slug).toBe(true)
            expect(types.has("FAQPage"), page.slug).toBe(true)
            if (page.kind === "how-to" || page.kind === "fix") {
                expect(types.has("HowTo"), page.slug).toBe(true)
                expect(types.has("HowToStep"), page.slug).toBe(true)
            } else {
                expect(types.has("Article"), page.slug).toBe(true)
            }
        }
    })

    it("adds every growth page and index to sitemap for every locale", () => {
        const urls = new Set(sitemap().map((entry) => entry.url))
        const growthSlugs = [
            ...GROWTH_INDEXES.map((index) => index.slug),
            ...GROWTH_PAGES.map((page) => page.slug),
        ]

        for (const locale of LOCALES) {
            for (const slug of growthSlugs) {
                expect(urls.has(buildCanonicalUrl(locale as Locale, slug)), `${locale}/${slug}`).toBe(true)
            }
        }
    })
})
