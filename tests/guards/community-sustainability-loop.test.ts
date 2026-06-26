import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string): string {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("community feedback and sustainability loop", () => {
    it("documents the support, sponsorship, and self-hosting business boundary", () => {
        const decision = read("docs/community-sustainability.md")
        const selfHostingDoc = read("docs/deployment/self-hosting.md")
        const readme = read("README.md")
        const pricingGuard = read("tests/guards/pricing-positioning.test.ts")

        expect(decision).toContain("There is no hosted paid plan")
        expect(decision).toContain("no hosted paid plan, cloud workspace, synced history, hosted API")
        expect(decision).toContain("paid self-hosting assistance")
        expect(decision).toContain("self-hosting packaging guidance")
        expect(decision).toContain("security and privacy review")
        expect(decision).toContain("custom local-first tool development")
        expect(decision).toContain("no-server-side-payload-processing")
        expect(selfHostingDoc).toContain("There is no SLA-backed enterprise product")
        expect(selfHostingDoc).toContain("Deployment owners are responsible")
        expect(selfHostingDoc).toContain("docs/community-sustainability.md")
        expect(readme).toContain("docs/community-sustainability.md")
        expect(pricingGuard).toContain("no hosted accounts")
        expect(pricingGuard).toContain("no payload sync")
        expect(pricingGuard).toContain("no server-side tool payload processing")
    })

    it("provides issue templates for tools, recipes, bugs, docs, and localization with sanitized-example guidance", () => {
        const templates = {
            bug: read(".github/ISSUE_TEMPLATE/bug_report.yml"),
            docs: read(".github/ISSUE_TEMPLATE/docs_request.yml"),
            feature: read(".github/ISSUE_TEMPLATE/feature_request.yml"),
            localization: read(".github/ISSUE_TEMPLATE/localization_request.yml"),
            recipe: read(".github/ISSUE_TEMPLATE/recipe_request.yml"),
        }
        const combined = Object.values(templates).join("\n")

        expect(templates.feature).toContain("Suggest a browser-local tool")
        expect(templates.recipe).toContain("Pipeline Builder recipe")
        expect(templates.recipe).toContain("Structure-only share URL")
        expect(templates.docs).toContain("Documentation gap")
        expect(templates.localization).toContain("Locale")
        expect(templates.bug).toContain("Steps to reproduce")
        expect(combined).toContain("Use sanitized examples only")
        expect(combined).toContain("Do not post production secrets")
        expect(combined).toContain("private payloads")
        expect(combined).toContain("request bodies")
        expect(combined).toContain("response bodies")
    })

    it("keeps public feedback, voting, contribution, and security paths connected", () => {
        const decision = read("docs/community-sustainability.md")
        const readme = read("README.md")
        const about = read("src/app/[lang]/about/page.tsx")
        const contact = read("src/app/[lang]/contact/page.tsx")
        const footer = read("src/components/layout/server-footer.tsx")
        const roadmap = read("src/app/[lang]/roadmap/page.tsx")
        const changelog = read("src/app/[lang]/changelog/page.tsx")
        const issueConfig = read(".github/ISSUE_TEMPLATE/config.yml")

        expect(decision).toContain("GitHub reactions and comments")
        expect(decision).toContain("Severity and privacy risk come first")
        expect(decision).toContain("unique commenters")
        expect(decision).toContain("linked duplicate issues")
        expect(readme).toContain("CONTRIBUTING.md")
        expect(readme).toContain("CODE_OF_CONDUCT.md")
        expect(readme).toContain("recipe requests")
        expect(readme).toContain("localization fixes")
        expect(about).toContain("/roadmap")
        expect(about).toContain("/changelog")
        expect(about).toContain("/self-hosting")
        expect(contact).toContain("GITHUB_FEATURE_REQUEST_URL")
        expect(contact).toContain("GITHUB_REQUEST_VOTING_URL")
        expect(contact).toContain("SECURITY_ADVISORY_URL")
        expect(footer).toContain("roadmap")
        expect(footer).toContain("changelog")
        expect(footer).toContain("self-hosting")
        expect(footer).toContain("contact")
        expect(roadmap).toContain("issues/new?template=feature_request.yml")
        expect(roadmap).toContain("label%3Aenhancement")
        expect(changelog).toContain("issues/new?template=feature_request.yml")
        expect(issueConfig).toContain("security/advisories/new")
        expect(issueConfig).toContain("Please report vulnerabilities privately")
    })
})
