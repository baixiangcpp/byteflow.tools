import fs from "node:fs"
import path from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import sitemap from "@/app/sitemap"
import { LOCALES } from "@/core/i18n/i18n"
import { buildCanonicalUrl } from "@/core/seo/urls"
import RoadmapPage from "@/app/[lang]/roadmap/page"
import ChangelogPage from "@/app/[lang]/changelog/page"
import SelfHostingPage from "@/app/[lang]/self-hosting/page"
import DistributionResearchPage from "@/app/[lang]/distribution-research/page"

const PUBLIC_PLANNING_SLUGS = ["roadmap", "changelog", "self-hosting", "distribution-research"]

describe("public roadmap, changelog, self-hosting, and distribution docs", () => {
    it("adds public planning pages to sitemap for every locale", () => {
        const urls = new Set(sitemap().map((entry) => entry.url))

        for (const locale of LOCALES) {
            for (const slug of PUBLIC_PLANNING_SLUGS) {
                expect(urls.has(buildCanonicalUrl(locale, slug)), `${locale}/${slug}`).toBe(true)
            }
        }
    })

    it("renders public planning pages with privacy-safe request and deployment boundaries", async () => {
        const params = Promise.resolve({ lang: "en" })
        const markup = [
            renderToStaticMarkup(await RoadmapPage({ params })),
            renderToStaticMarkup(await ChangelogPage({ params })),
            renderToStaticMarkup(await SelfHostingPage({ params })),
            renderToStaticMarkup(await DistributionResearchPage({ params })),
        ].join("\n")

        expect(markup).toContain("Request a tool")
        expect(markup).toContain("no server-side tool payload processing")
        expect(markup).toContain("no payload sync")
        expect(markup).toContain("Self-host byteflow.tools")
        expect(markup).toContain("/en/roadmap")
    })

    it("documents self-hosting and distribution research without proposing cloud payload history", () => {
        const docs = [
            "docs/deployment/self-hosting.md",
            "docs/growth/distribution-research.md",
            "README.md",
            ".github/ISSUE_TEMPLATE/feature_request.yml",
        ].map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8")).join("\n")

        expect(docs).toContain("no server-side tool payload processing")
        expect(docs).toContain("no payload sync")
        expect(docs).toContain("no forced accounts")
        expect(docs).toContain("Do not post production secrets")
        expect(docs).not.toMatch(/enable cloud history|add payload sync|require accounts/i)
    })
})
