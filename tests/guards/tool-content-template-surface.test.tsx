import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ToolContentTemplateSurface } from "@/core/seo/components/tool-content-template-surface"

describe("tool content template surface width contract", () => {
    it("inherits the route shell instead of measuring a preceding tool container", () => {
        render(
            <ToolContentTemplateSurface source="server">
                <div>Template content</div>
            </ToolContentTemplateSurface>,
        )

        const section = document.querySelector<HTMLElement>('[data-tool-content-template="full"]')
        expect(section).not.toBeNull()
        expect(section).toHaveAttribute("data-tool-content-template-width-sync", "contract")
        expect(section).toHaveClass("w-full")
        expect(section).not.toHaveClass("mx-auto")
        expect(section?.className).not.toContain("max-w-")
        expect(section?.style.maxWidth).toBe("")
    })
})
