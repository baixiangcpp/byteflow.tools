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
import SupportPage from "@/app/[lang]/support/page"
import DistributionResearchPage from "@/app/[lang]/distribution-research/page"
import ContactPage from "@/app/[lang]/contact/page"

const PUBLIC_PLANNING_SLUGS = ["roadmap", "changelog", "self-hosting", "support", "distribution-research"]

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
            renderToStaticMarkup(await SupportPage({ params })),
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
        expect(markup).toContain("no tracking pixels")
        expect(markup).toContain("no personalized ads")
        expect(markup).toContain("no ad scripts")
        expect(markup).toContain("payload access")
        expect(markup).toContain("No cloud account or hosted payload history")
        expect(markup).toContain("Self-host byteflow.tools")
        expect(markup).toContain("Privacy-safe support")
        expect(markup).toContain("/en/roadmap")
        expect(markup).toContain("/en/distribution-research")
        expect(markup).toContain("/en/self-hosting")
        expect(markup).toContain("/en/support")
        expect(markup).toContain("feat%3A%20extension%20or%20desktop%20distribution")
        expect(markup).toContain("issues/new?template=feature_request.yml")
        expect(markup).toContain("label%3Aenhancement")
        expect(markup).toContain("Do not post real secrets")
    })

    it("renders contact public-planning CTAs in localized route copy", () => {
        const markup = renderToStaticMarkup(createElement(
            LangProvider,
            { lang: "zh-CN", translations: getTranslation("zh-CN") },
            createElement(ContactPage),
        ))

        expect(markup).toContain("公开规划")
        expect(markup).toContain("路线图")
        expect(markup).toContain("扩展与桌面端调研")
        expect(markup).toContain("自托管")
        expect(markup).toContain("已脱敏")
        expect(markup).not.toContain("Public planning")
        expect(markup).not.toContain("Extension and desktop research")
        expect(markup).not.toContain("Use public requests only with sanitized examples")
    })

    it("ships a localized privacy-safe sponsor and support conversion path", async () => {
        const urls = new Set(sitemap().map((entry) => entry.url))
        const sources = {
            contact: fs.readFileSync(path.join(process.cwd(), "src/app/[lang]/contact/page.tsx"), "utf8"),
            footer: fs.readFileSync(path.join(process.cwd(), "src/components/layout/server-footer.tsx"), "utf8"),
            pricing: fs.readFileSync(path.join(process.cwd(), "src/app/[lang]/pricing/page.tsx"), "utf8"),
            selfHosting: fs.readFileSync(path.join(process.cwd(), "src/app/[lang]/self-hosting/page.tsx"), "utf8"),
            support: fs.readFileSync(path.join(process.cwd(), "src/app/[lang]/support/page.tsx"), "utf8"),
        }

        for (const locale of LOCALES) {
            const copy = getTranslation(locale).pages
            expect(copy.support_title.trim(), locale).not.toBe("")
            expect(copy.support_intro.trim(), locale).not.toBe("")
            expect(copy.support_boundary_no_tracking.trim(), locale).not.toBe("")
            expect(copy.support_boundary_no_payload.trim(), locale).not.toBe("")
            expect(copy.contact_support_desc.trim(), locale).not.toBe("")
            expect(urls.has(buildCanonicalUrl(locale, "support")), `${locale}/support`).toBe(true)
        }

        const markup = renderToStaticMarkup(await SupportPage({ params: Promise.resolve({ lang: "en" }) }))
        expect(markup).toContain("Core tools remain free and open source")
        expect(markup).toContain("no tracking pixels")
        expect(markup).toContain("no personalized ads")
        expect(markup).toContain("no ad scripts")
        expect(markup).toContain("payload access")
        expect(markup).toContain("query text")
        expect(markup).toContain("user identifiers")
        expect(markup).toContain("behavioral profiles")
        expect(markup).toContain("static hosting")
        expect(markup).toContain("internal deployment")
        expect(markup).toContain("security review")
        expect(markup).toContain("packaging")
        expect(markup).toContain("maintenance")
        expect(markup).toContain("No cloud account or hosted payload history")

        expect(sources.contact).toContain("/support")
        expect(sources.footer).toContain("support")
        expect(sources.pricing).toContain("/support")
        expect(sources.selfHosting).toContain("/support")
        expect(sources.support).not.toMatch(/googletag|adsbygoogle|doubleclick|googlesyndication|facebook\.net|connect\.facebook|gtag\(|trackingPixel|tracking-pixel/i)
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
