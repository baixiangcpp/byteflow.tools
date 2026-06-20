import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { TOOL_REGISTRY, getToolBySlug } from "@/core/registry"
import { buildToolMetadata } from "@/core/seo/seo"
import {
    buildArticleJsonLd,
    buildCollectionPageJsonLd,
    buildHowToJsonLd,
    buildToolJsonLdGraph,
    buildWebsiteJsonLd,
} from "@/core/seo/jsonld"
import { ToolBreadcrumbJsonLd } from "@/core/seo/components/json-ld"
import { ArticleJsonLd, CollectionPageJsonLd, HowToJsonLd } from "@/core/seo/components/page-json-ld"

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

function parseJsonLdFromMarkup(markup: string) {
    const match = markup.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
    expect(match?.[1]).toBeTruthy()
    return JSON.parse(match?.[1] ?? "{}") as Record<string, unknown>
}

describe("JSON-LD foundation", () => {
    it("builds WebSite schema with SearchAction for home pages", () => {
        const schema = buildWebsiteJsonLd("en")
        const types = collectTypes(schema)

        expect([...types]).toEqual(expect.arrayContaining(["Organization", "WebSite", "SearchAction"]))
        expect(JSON.stringify(schema)).toContain("https://byteflow.tools/en/all-tools?search={search_term_string}")
    })

    it("builds tool WebApplication and BreadcrumbList schema from registry metadata", () => {
        const tool = getToolBySlug("json-formatter")
        expect(tool).toBeTruthy()

        const schema = buildToolJsonLdGraph({ lang: "en", tool: tool! })
        const types = collectTypes(schema)
        const serialized = JSON.stringify(schema)

        expect([...types]).toEqual(expect.arrayContaining(["WebApplication", "BreadcrumbList"]))
        expect(serialized).toContain("https://byteflow.tools/en/json-formatter")
        expect(serialized).toContain("JSON Formatter")
        expect(serialized).not.toContain("sampleInput")
        if (tool?.sampleInput) {
            expect(serialized).not.toContain(tool.sampleInput)
        }
    })

    it("renders tool schema graph through the shared tool JSON-LD component", () => {
        const markup = renderToStaticMarkup(<ToolBreadcrumbJsonLd lang="en" slug="json-formatter" />)
        const schema = parseJsonLdFromMarkup(markup)
        const types = collectTypes(schema)

        expect(markup).toContain('data-jsonld="tool"')
        expect([...types]).toEqual(expect.arrayContaining(["WebApplication", "BreadcrumbList"]))
    })

    it("builds CollectionPage, Article, and HowTo schema through shared page helpers", () => {
        const collection = buildCollectionPageJsonLd({
            lang: "en",
            slug: "data-code-formats",
            title: "Data & Code Formats",
            description: "Format and convert code-oriented data formats.",
        })
        const article = buildArticleJsonLd({
            lang: "zh-CN",
            slug: "json-formatting-errors",
            title: "JSON 格式错误修复",
            description: "定位并修复 JSON 语法错误。",
        })
        const howTo = buildHowToJsonLd({
            lang: "en",
            slug: "format-json-safely",
            title: "Format JSON Safely",
            description: "Format JSON locally before sharing.",
            steps: [
                { name: "Paste JSON", text: "Paste JSON into the local editor." },
                { name: "Format", text: "Run format and inspect the result." },
            ],
        })

        expect(collectTypes(collection)).toContain("CollectionPage")
        expect(collectTypes(article)).toContain("Article")
        expect([...collectTypes(howTo)]).toEqual(expect.arrayContaining(["HowTo", "HowToStep"]))
    })

    it("renders page-level JSON-LD components with stable markers", () => {
        const collectionMarkup = renderToStaticMarkup(
            <CollectionPageJsonLd
                lang="en"
                slug="data-code-formats"
                title="Data & Code Formats"
                description="Format and convert code-oriented data formats."
            />,
        )
        const articleMarkup = renderToStaticMarkup(
            <ArticleJsonLd
                lang="zh-CN"
                slug="json-formatting-errors"
                title="JSON 格式错误修复"
                description="定位并修复 JSON 语法错误。"
            />,
        )
        const howToMarkup = renderToStaticMarkup(
            <HowToJsonLd
                lang="en"
                slug="format-json-safely"
                title="Format JSON Safely"
                description="Format JSON locally before sharing."
                steps={[{ name: "Paste JSON", text: "Paste JSON into the local editor." }]}
            />,
        )

        expect(collectionMarkup).toContain('data-jsonld="collection-page"')
        expect(collectTypes(parseJsonLdFromMarkup(collectionMarkup))).toContain("CollectionPage")
        expect(articleMarkup).toContain('data-jsonld="article"')
        expect(collectTypes(parseJsonLdFromMarkup(articleMarkup))).toContain("Article")
        expect(howToMarkup).toContain('data-jsonld="how-to"')
        expect([...collectTypes(parseJsonLdFromMarkup(howToMarkup))]).toEqual(expect.arrayContaining(["HowTo", "HowToStep"]))
    })

    it("keeps English tool metadata descriptions unique across registry tools", () => {
        const descriptions = new Map<string, string[]>()

        for (const tool of TOOL_REGISTRY) {
            const metadata = buildToolMetadata({ lang: "en", slug: tool.slug })
            const description = String(metadata.description ?? "").trim()
            expect(description, tool.slug).not.toBe("")
            descriptions.set(description, [...(descriptions.get(description) ?? []), tool.slug])
        }

        const duplicates = Array.from(descriptions.entries())
            .filter(([, slugs]) => slugs.length > 1)
            .map(([description, slugs]) => ({ description, slugs }))

        expect(duplicates).toEqual([])
    })
})
