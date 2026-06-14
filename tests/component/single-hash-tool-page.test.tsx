import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { SingleHashToolPage } from "@/features/tool-templates/single-hash-tool-page"
import { getTranslation } from "@/core/i18n/translations/catalog"

vi.mock("next/navigation", () => ({
    usePathname: () => "/zh-CN/sha224-digest-generator",
}))

describe("single hash tool page", () => {
    it("uses locale defaults when optional labels are omitted", () => {
        render(
            <LangProvider lang="zh-CN" translations={getTranslation("zh-CN")}>
                <SingleHashToolPage
                    algorithm="sha224"
                    title="SHA-224"
                    description="desc"
                    outputLabel="SHA-224 摘要"
                    outputPlaceholder="SHA-224 摘要将显示在这里"
                />
            </LangProvider>,
        )

        expect(screen.getByText("输入")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("输入或粘贴文本...")).toBeInTheDocument()
        expect(screen.getByText("打开完整哈希工具")).toBeInTheDocument()
        expect(screen.queryByText("Input Text")).not.toBeInTheDocument()
        expect(screen.queryByText("Open Full Hash Tool")).not.toBeInTheDocument()
    })
})
