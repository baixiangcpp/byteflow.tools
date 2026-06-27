import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import fs from "node:fs"
import { getGuideIndexItems, getGuideRelatedTools, getPublishedGuideSlugs } from "@/core/growth/guide-index"
import { GrowthIndexPage } from "@/core/seo/components/growth-content-pages"
import { ToolContentTemplateServer } from "@/core/seo/components/tool-content-template-server"
import { CATEGORY_HUB_CONTENT, getTutorialLink } from "@/core/workflows/workflow-hubs"

const SECRET_PATTERNS = [
    /sk-[A-Za-z0-9]{20,}/,
    /gh[pousr]_[A-Za-z0-9_]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /Bearer\s+eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
]

describe("content guide hub acceptance", () => {
    it("publishes at least six curated guides on the how-to hub", () => {
        const guides = getGuideIndexItems("en")
        const markup = renderToStaticMarkup(<GrowthIndexPage locale="en" slug="how-to" />)

        expect(guides.length).toBeGreaterThanOrEqual(6)
        expect(new Set(guides.map((guide) => guide.slug)).size).toBe(guides.length)

        for (const guide of guides) {
            expect(markup, guide.slug).toContain(`/en/${guide.slug}`)
            expect(guide.title.trim(), guide.slug).not.toBe("")
            expect(guide.description.trim(), guide.slug).not.toBe("")
            expect(guide.relatedToolKeys.length, guide.slug).toBeGreaterThan(0)
            expect(guide.relatedRecipeSlugs.length, guide.slug).toBeGreaterThan(0)
            expect(guide.safeExampleOnly, guide.slug).toBe(true)

            for (const tool of getGuideRelatedTools("en", guide)) {
                expect(markup, `${guide.slug} tool ${tool.slug}`).toContain(`/en/${tool.slug}`)
            }
            for (const recipeSlug of guide.relatedRecipeSlugs) {
                expect(markup, `${guide.slug} recipe ${recipeSlug}`).toContain(`/en/workflows/${recipeSlug}`)
            }
        }
    })

    it("links the guide hub from Home and All Tools", () => {
        const sources = [
            "src/app/[lang]/page.tsx",
            "src/app/[lang]/all-tools/page.tsx",
            "src/features/tool-discovery/all-tools-discovery.tsx",
        ].map((file) => fs.readFileSync(file, "utf8")).join("\n")

        expect(sources).toContain("getGrowthIndex(\"how-to\")")
        expect(sources).toContain("getGuideIndexItems(locale)")
        expect(sources).toContain("href={`/${locale}/how-to`}")
    })

    it("links relevant tool pages back to matching guides", () => {
        const jwtMarkup = renderToStaticMarkup(<ToolContentTemplateServer toolSlug="jwt-decoder" lang="en" />)
        const jsonMarkup = renderToStaticMarkup(<ToolContentTemplateServer toolSlug="json-formatter" lang="en" />)
        const openApiMarkup = renderToStaticMarkup(<ToolContentTemplateServer toolSlug="openapi-viewer" lang="en" />)

        expect(jwtMarkup).toContain("Related guides")
        expect(jwtMarkup).toContain("/en/how-to/decode-jwt-locally")
        expect(jwtMarkup).toContain("/en/jwt-security-best-practices-for-token-handling")

        expect(jsonMarkup).toContain("/en/validate-json-before-api-requests")
        expect(jsonMarkup).toContain("/en/json-schema-validation-checklist")

        expect(openApiMarkup).toContain("/en/openapi-debugging-workflow-checklist")
    })

    it("keeps category hubs connected to related guide pages", () => {
        for (const [groupKey, hub] of Object.entries(CATEGORY_HUB_CONTENT)) {
            expect(hub.tutorialSlugs.length, groupKey).toBeGreaterThanOrEqual(3)
            for (const slug of hub.tutorialSlugs) {
                expect(getTutorialLink(slug), `${groupKey} tutorial ${slug}`).toBeTruthy()
            }
        }

        expect(getPublishedGuideSlugs().some((slug) => CATEGORY_HUB_CONTENT.data_code_formats.tutorialSlugs.includes(slug))).toBe(true)
        expect(getPublishedGuideSlugs().some((slug) => CATEGORY_HUB_CONTENT.encoding_crypto.tutorialSlugs.includes(slug))).toBe(true)
        expect(getPublishedGuideSlugs().some((slug) => CATEGORY_HUB_CONTENT.images_svg_css.tutorialSlugs.includes(slug))).toBe(true)
    })

    it("keeps selected guide source examples free of obvious real secrets", () => {
        const sourceFiles = [
            "src/core/growth/guide-index.ts",
            "src/core/growth/growth-pages.ts",
            ...getGuideIndexItems("en")
                .filter((guide) => guide.source === "article")
                .map((guide) => `src/app/[lang]/${guide.slug}/page.tsx`),
        ]

        for (const file of sourceFiles) {
            const source = fs.readFileSync(file, "utf8")
            for (const pattern of SECRET_PATTERNS) {
                expect(source, `${file} matched ${pattern}`).not.toMatch(pattern)
            }
        }
    })
})
