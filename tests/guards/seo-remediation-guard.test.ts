import fs from "node:fs"
import path from "node:path"
import sitemap from "@/app/sitemap"
import sitemapLastmod from "@/lib/sitemap-lastmod.json"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

function countLastmodValues(value: unknown, counts = new Map<string, number>()) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(value)) {
        counts.set(value, (counts.get(value) ?? 0) + 1)
        return counts
    }

    if (value && typeof value === "object") {
        for (const child of Object.values(value as Record<string, unknown>)) {
            countLastmodValues(child, counts)
        }
    }

    return counts
}

describe("SEO remediation guardrails", () => {
    it("prevents sitemap lastmod from collapsing the whole site to one release day", () => {
        const counts = countLastmodValues(sitemapLastmod)
        const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0)
        const largestCluster = Math.max(...counts.values())

        expect(total).toBeGreaterThan(100)
        expect(largestCluster / total).toBeLessThan(0.9)
    })

    it("keeps the root x-default target consistent between sitemap and rendered metadata policy", () => {
        const rootEntry = sitemap().find((entry) => entry.url === "https://byteflow.tools/")
        const enEntry = sitemap().find((entry) => entry.url === "https://byteflow.tools/en")

        expect(rootEntry?.alternates?.languages?.["x-default"]).toBe("https://byteflow.tools")
        expect(enEntry?.alternates?.languages?.["x-default"]).toBe("https://byteflow.tools")
    })

    it("blocks handoff query URLs from crawler entry points", () => {
        const robotsSource = read("src/app/robots.ts")
        const handoffSource = read("src/core/routing/tool-handoff.ts")

        expect(robotsSource).toContain("disallow")
        expect(robotsSource).toContain("*?handoff=")
        expect(robotsSource).toContain("*?handoff_ref=")
        expect(handoffSource).toContain("#${HANDOFF_PARAM}=")
        expect(handoffSource).toContain("#${HANDOFF_REF_PARAM}=")
        expect(handoffSource).not.toContain("?${HANDOFF_PARAM}=")
        expect(handoffSource).not.toContain("?${HANDOFF_REF_PARAM}=")
    })

    it("ships deployment-level 301 redirects for legacy tool aliases", () => {
        const redirects = read("public/_redirects")

        expect(redirects).toContain("/en/cron-expression-generator /en/crontab-generator 301")
        expect(redirects).toContain("/zh-CN/cron-expression-generator /zh-CN/crontab-generator 301")
        expect(redirects).toContain("/fr/cron-expression-generator /fr/crontab-generator 301")
    })

    it("keeps FAQPage schema behind an allowlist gate", () => {
        const packageJson = JSON.parse(read("package.json")) as { scripts: Record<string, string> }
        const coreSource = read("src/core/seo/components/tool-content-template-modules/core.tsx")
        const faqGateSource = read("scripts/gates/check-faq-schema.js")

        expect(coreSource).toContain("shouldEmitFaqSchema")
        expect(coreSource).toContain("{faqSchema ? <JsonLdScript data-faq-schema=\"tool\" jsonLd={faqSchema} /> : null}")
        expect(packageJson.scripts["build:post"]).toContain("check:faq-schema")
        expect(faqGateSource).toContain("ALLOWED_FAQ_SCHEMA_SLUGS")
    })
})
