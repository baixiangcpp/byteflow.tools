import fs from "node:fs"
import path from "node:path"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import sitemap from "@/app/sitemap"
import { LOCALES } from "@/core/i18n/i18n"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { buildCanonicalUrl } from "@/core/seo/urls"
import RoadmapPage from "@/app/[lang]/roadmap/page"
import ChangelogPage from "@/app/[lang]/changelog/page"
import SelfHostingPage from "@/app/[lang]/self-hosting/page"
import DistributionResearchPage from "@/app/[lang]/distribution-research/page"
import ContactPage from "@/app/[lang]/contact/page"

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
            renderToStaticMarkup(createElement(
                LangProvider,
                { lang: "en", translations: getTranslation("en") },
                createElement(ContactPage),
            )),
        ].join("\n")

        expect(markup).toContain("Request a tool")
        expect(markup).toContain("Vote on requests")
        expect(markup).toContain("Request and vote")
        expect(markup).toContain("Extension and desktop research")
        expect(markup).toContain("Vote on launcher demand")
        expect(markup).toContain("Request launcher access")
        expect(markup).toContain("no server-side tool payload processing")
        expect(markup).toContain("no payload sync")
        expect(markup).toContain("Self-host byteflow.tools")
        expect(markup).toContain("/en/roadmap")
        expect(markup).toContain("/en/distribution-research")
        expect(markup).toContain("/en/self-hosting")
        expect(markup).toContain("feat%3A%20extension%20or%20desktop%20distribution")
        expect(markup).toContain("issues/new?template=feature_request.yml")
        expect(markup).toContain("label%3Aenhancement")
        expect(markup).toContain("Do not post real secrets")
    })

    it("keeps the All Tools empty state wired to privacy-safe request and voting flows", () => {
        const allToolsPage = fs.readFileSync(path.join(process.cwd(), "src/app/[lang]/all-tools/page.tsx"), "utf8")
        const allToolsDiscovery = fs.readFileSync(path.join(process.cwd(), "src/features/tool-discovery/all-tools-discovery.tsx"), "utf8")
        const englishCopy = fs.readFileSync(path.join(process.cwd(), "src/core/i18n/translations/en.json"), "utf8")

        expect(allToolsPage).toContain("requestToolPrivacy")
        expect(allToolsPage).toContain("voteOnRequests")
        expect(allToolsDiscovery).toContain("TOOL_REQUEST_URL")
        expect(allToolsDiscovery).toContain("TOOL_REQUEST_VOTING_URL")
        expect(allToolsDiscovery).toContain("issues/new?template=feature_request.yml")
        expect(allToolsDiscovery).toContain("label%3Aenhancement")
        expect(englishCopy).toContain("Use sanitized examples only")
        expect(englishCopy).toContain("Vote on existing requests")
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
