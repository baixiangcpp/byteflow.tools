import * as React from "react"
import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CategoryHub } from "@/core/seo/components/category-hub"
import { MenuGroupHub } from "@/core/seo/components/menu-group-hub"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { TRANSLATIONS } from "@/core/i18n/translations/catalog"

const mocks = vi.hoisted(() => ({
    langValue: {
        lang: "en",
        t: {} as typeof TRANSLATIONS.en,
    },
    translationValue: {} as typeof TRANSLATIONS.en,
}))

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

vi.mock("@/core/i18n/lang-provider", () => ({
    useLang: () => mocks.langValue,
}))

vi.mock("@/core/i18n/translations/catalog", async () => {
    const actual = await vi.importActual<typeof import("@/core/i18n/translations/catalog")>("@/core/i18n/translations/catalog")
    return {
        ...actual,
        getTranslation: () => mocks.translationValue,
    }
})

function cloneEnglishTranslations() {
    return JSON.parse(JSON.stringify(TRANSLATIONS.en)) as typeof TRANSLATIONS.en
}

describe("seo surface i18n guards", () => {
    beforeEach(() => {
        mocks.langValue = {
            lang: "en",
            t: TRANSLATIONS.en,
        }
        mocks.translationValue = TRANSLATIONS.en
    })

    it("fails fast when a related tool title is missing", () => {
        const broken = cloneEnglishTranslations()
        broken.tools.jsonpath_playground.title = ""
        mocks.langValue = { lang: "en", t: broken }

        expect(() => render(<RelatedTools toolKey="json_formatter" />)).toThrow(
            "[i18n] Missing translation value for tools.jsonpath_playground.title",
        )
    })

    it("uses localized generic related-tool reasons outside English", () => {
        mocks.langValue = { lang: "zh-CN", t: TRANSLATIONS["zh-CN"] }

        const { container } = render(<RelatedTools toolKey="json_formatter" />)

        expect(container.textContent).toContain("此工具的建议下一步工作流。")
        expect(container.textContent).not.toContain("Run JSONPath queries")
        expect(container.textContent).not.toContain("Continue from json formatter")
    })

    it("fails fast when a category hub tool description is missing", () => {
        const broken = cloneEnglishTranslations()
        broken.tools.json_formatter.description = ""
        mocks.langValue = { lang: "en", t: broken }
        mocks.translationValue = broken

        expect(() =>
            render(<CategoryHub lang="en" category="formatters" titleKey="formatters" descriptionKey="formatters_desc" />),
        ).toThrow("[i18n] Missing translation value for tools.json_formatter.description")
    })

    it("fails fast when a menu group tool title is missing", () => {
        const broken = cloneEnglishTranslations()
        broken.tools.jwt_decoder.title = ""
        mocks.langValue = { lang: "en", t: broken }
        mocks.translationValue = broken

        expect(() => render(<MenuGroupHub lang="en" groupKey="web_api" />)).toThrow(
            "[i18n] Missing translation value for tools.jwt_decoder.title",
        )
    })
})
