import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { ToolContentTemplateSurface } from "@/core/seo/components/tool-content-template-surface"

class ResizeObserverMock {
    private readonly callback: ResizeObserverCallback

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback
    }

    observe(target: Element) {
        const width = Number.parseFloat((target as HTMLElement).style.width || "") || 0
        this.callback(
            [
                {
                    target,
                    contentRect: {
                        x: 0,
                        y: 0,
                        width,
                        height: 0,
                        top: 0,
                        right: width,
                        bottom: 0,
                        left: 0,
                        toJSON: () => ({}),
                    } as DOMRectReadOnly,
                } as ResizeObserverEntry,
            ],
            this as unknown as ResizeObserver,
        )
    }

    unobserve() {}

    disconnect() {}
}

describe("tool content template surface width sync", () => {
    beforeEach(() => {
        vi.stubGlobal("ResizeObserver", ResizeObserverMock)
    })

    it("syncs template width to the tool container derived from the page h1", async () => {
        render(
            <main>
                <div className="mx-auto w-full max-w-5xl" style={{ width: "1024px" }}>
                    <h1>HTTP Request Builder</h1>
                </div>
                <div data-related-tools-source="inline">Related tools block</div>
                <ToolContentTemplateSurface source="server">
                    <div>Template content</div>
                </ToolContentTemplateSurface>
            </main>,
        )

        const section = document.querySelector<HTMLElement>('[data-tool-content-template="full"]')
        expect(section).not.toBeNull()

        await waitFor(() => {
            expect(section?.getAttribute("data-tool-content-template-width-sync")).toBe("synced")
            expect(section?.style.maxWidth).toBe("1024px")
        })
    })
})
