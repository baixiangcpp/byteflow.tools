import * as React from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { getToolByKey } from "@/core/registry"
import { buildToolTemplateModel, FAQ_SCHEMA_TOOL_SLUGS, ToolContentTemplateSection } from "@/core/seo/components/tool-content-template-modules/core"
import { EN_FALLBACK_PACK } from "@/core/seo/components/tool-content-template-modules/packs/en"
import { ZH_CN_FALLBACK_PACK } from "@/core/seo/components/tool-content-template-modules/packs/zh-cn"
import { TOP_TOOL_CONTENT_TEMPLATES } from "@/core/seo/components/tool-content-template-modules/top-templates"
import zhCnLocalizedTemplates from "@/core/seo/components/tool-content-template-modules/generated/zh-CN.json"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

function buildModelForEn(toolSlug: string, topTemplates?: typeof TOP_TOOL_CONTENT_TEMPLATES) {
    return buildToolTemplateModel({
        toolSlug,
        lang: "en",
        t: getTranslation("en") as Record<string, unknown>,
        pack: EN_FALLBACK_PACK,
        topTemplates,
    })
}

describe("tool content template model selection", () => {
    it("uses top templates for en when slug is present", () => {
        const model = buildModelForEn("json-formatter", TOP_TOOL_CONTENT_TEMPLATES)

        expect(model).not.toBeNull()
        expect(model?.content).toBe(TOP_TOOL_CONTENT_TEMPLATES["json-formatter"])
    })

    it("falls back to locale pack when top templates are unavailable", () => {
        const model = buildModelForEn("json-formatter")

        expect(model).not.toBeNull()
        expect(model?.content.toolKey).toBe("json_formatter")
        expect(model?.content.intro).toContain(EN_FALLBACK_PACK.introSuffix)
        expect(model?.relatedWorkflows.map((workflow) => workflow.slug)).toEqual([
            "api-payload-cleanup",
            "json-typescript-contract-review",
        ])
    })

    it("does not apply en top templates for non-en locales", () => {
        const model = buildToolTemplateModel({
            toolSlug: "json-formatter",
            lang: "zh-CN",
            t: getTranslation("zh-CN") as Record<string, unknown>,
            pack: ZH_CN_FALLBACK_PACK,
            topTemplates: TOP_TOOL_CONTENT_TEMPLATES,
            localizedTemplates: zhCnLocalizedTemplates,
        })

        expect(model).not.toBeNull()
        expect(model?.content).not.toBe(TOP_TOOL_CONTENT_TEMPLATES["json-formatter"])
        expect(model?.content.toolKey).toBe("json_formatter")
        expect(model?.content.intro).toBe(zhCnLocalizedTemplates["json-formatter"].content.intro)
        expect(model?.workflowSteps).toEqual(zhCnLocalizedTemplates["json-formatter"].workflowSteps)
    })

    it("fails fast when a fallback template is missing localized tool copy", () => {
        const brokenTranslation = JSON.parse(JSON.stringify(getTranslation("en"))) as Record<string, unknown>
        const brokenTools = brokenTranslation.tools as Record<string, { title?: string; description?: string }>
        brokenTools.json_formatter.title = ""

        expect(() =>
            buildToolTemplateModel({
                toolSlug: "json-formatter",
                lang: "en",
                t: brokenTranslation,
                pack: EN_FALLBACK_PACK,
            }),
        ).toThrow("[i18n] Missing translation value for tools.json_formatter.title")
    })
})

describe("tool content FAQ JSON-LD shape", () => {
    it("renders FAQPage schema for the sampled core tool templates", () => {
        expect(Array.from(FAQ_SCHEMA_TOOL_SLUGS)).toEqual([
            "json-formatter",
            "jwt-decoder",
            "base64-encode-decode",
            "hash-generator",
            "markdown-preview",
            "image-resizer",
        ])

        for (const toolSlug of FAQ_SCHEMA_TOOL_SLUGS) {
            const model = buildModelForEn(toolSlug)
            expect(model).not.toBeNull()
            if (!model) throw new Error(`expected model for ${toolSlug}`)

            const { container } = render(
                <ToolContentTemplateSection
                    model={model}
                    source="server"
                />,
            )

            const faqScript = container.querySelector("script[data-faq-schema=\"tool\"]")
            expect(faqScript).not.toBeNull()
            if (!faqScript?.textContent) throw new Error("expected faq schema script content")

            const schema = JSON.parse(faqScript.textContent) as {
                "@context": string
                "@type": string
                mainEntity: Array<{
                    "@type": string
                    name: string
                    acceptedAnswer: {
                        "@type": string
                        text: string
                    }
                }>
            }

            expect(schema["@context"]).toBe("https://schema.org")
            expect(schema["@type"]).toBe("FAQPage")
            expect(schema.mainEntity.length).toBe(model.content.faqs.length)
            expect(schema.mainEntity.length).toBeGreaterThanOrEqual(3)

            for (const entry of schema.mainEntity) {
                expect(entry["@type"]).toBe("Question")
                expect(typeof entry.name).toBe("string")
                expect(entry.acceptedAnswer?.["@type"]).toBe("Answer")
                expect(typeof entry.acceptedAnswer?.text).toBe("string")
                expect(container.textContent).toContain(entry.name)
                expect(container.textContent).toContain(entry.acceptedAnswer.text)
            }
        }
    })

    it("renders from the prebuilt model without re-reading unrelated translations", () => {
        const model = buildModelForEn("json-formatter")

        expect(model).not.toBeNull()
        if (!model) throw new Error("expected model to be available")

        expect(() =>
            render(
                <ToolContentTemplateSection
                    model={model}
                    source="server"
                />,
            ),
        ).not.toThrow()
    })

    it("does not emit FAQPage schema for non-allowlisted tool templates", () => {
        const model = buildModelForEn("xml-formatter")
        expect(model).not.toBeNull()
        if (!model) throw new Error("expected model to be available")

        const { container } = render(
            <ToolContentTemplateSection
                model={model}
                source="server"
            />,
        )

        expect(container.querySelector("script[data-faq-schema=\"tool\"]")).toBeNull()
        expect(container.textContent).toContain(model.copy.frequentlyAskedQuestions)
    })

    it("links template privacy notes to the Trust Center", () => {
        const model = buildModelForEn("json-formatter")
        expect(model).not.toBeNull()
        if (!model) throw new Error("expected model to be available")

        const { container } = render(
            <ToolContentTemplateSection
                model={model}
                source="server"
            />,
        )

        const trustCenterLink = container.querySelector('a[href="/en/trust-center"]')
        expect(trustCenterLink?.textContent).toBe("Trust Center")
    })

    it("renders related workflow links from the workflow registry", () => {
        const model = buildModelForEn("json-formatter")
        expect(model).not.toBeNull()
        if (!model) throw new Error("expected model to be available")

        const { container } = render(
            <ToolContentTemplateSection
                model={model}
                source="server"
            />,
        )

        expect(container.textContent).toContain(model.copy.relatedWorkflows)
        expect(container.querySelector('a[href="/en/workflows/api-payload-cleanup"]')).not.toBeNull()
        expect(container.querySelector('a[href="/en/workflows/json-typescript-contract-review"]')).not.toBeNull()
    })

    it("renders related tool links from manifest metadata without payload URLs", () => {
        const model = buildModelForEn("json-formatter")
        expect(model).not.toBeNull()
        if (!model) throw new Error("expected model to be available")

        const { container } = render(
            <ToolContentTemplateSection
                model={model}
                source="server"
            />,
        )

        expect(model.relatedTools.length).toBeGreaterThanOrEqual(3)
        expect(container.textContent).toContain(model.copy.relatedTools)
        for (const toolKey of ["jsonpath_playground", "json_diff_viewer", "json_to_typescript", "yaml_json_converter"]) {
            const tool = getToolByKey(toolKey)
            expect(tool, toolKey).toBeTruthy()
            expect(container.querySelector(`a[href="/en/${tool?.slug}"]`)).not.toBeNull()
        }
        expect(container.innerHTML).not.toContain("?input=")
        expect(container.innerHTML).not.toContain("?output=")
        expect(container.innerHTML).not.toContain("#payload=")
    })
})
