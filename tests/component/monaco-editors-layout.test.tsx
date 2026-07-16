import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"

const { loaderConfigMock } = vi.hoisted(() => ({
    loaderConfigMock: vi.fn(),
}))

vi.mock("next/dynamic", () => ({
    default: (loader: unknown) => {
        const isDiffEditor = String(loader).includes("DiffEditor")
        return (props: Record<string, unknown>) => (
            <div
                data-testid={isDiffEditor ? "dynamic-monaco-diff" : "dynamic-monaco-editor"}
                data-height={String(props.height ?? "")}
            />
        )
    },
}))

vi.mock("@monaco-editor/react", () => ({
    loader: {
        config: loaderConfigMock,
    },
}))

vi.mock("monaco-editor", () => ({}))

import { MonacoDiffEditor, MonacoEditor } from "@/features/tool-shell/monaco-editors"

function installDesktopMatchMedia() {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
            matches: false,
            media: "(max-width: 768px)",
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    })
}

class ResizeObserverMock {
    private readonly callback: ResizeObserverCallback

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback
    }

    observe(target: Element) {
        const height = (target as HTMLElement).clientHeight || 0
        this.callback(
            [
                {
                    target,
                    contentRect: {
                        x: 0,
                        y: 0,
                        width: 0,
                        height,
                        top: 0,
                        right: 0,
                        bottom: height,
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

function HeightHost({ height, children }: { height: number; children: React.ReactNode }) {
    return <div style={{ height: `${height}px` }}>{children}</div>
}

function renderWithLang(ui: React.ReactElement) {
    return render(<LangProvider lang="en" translations={getTranslation("en")}>{ui}</LangProvider>)
}

describe("monaco editor layout guard", () => {
    beforeEach(() => {
        installDesktopMatchMedia()
        vi.stubGlobal("ResizeObserver", ResizeObserverMock)
        loaderConfigMock.mockReset()
    })

    it("resolves percentage height to parent pixel height for MonacoEditor", async () => {
        renderWithLang(
            <HeightHost height={640}>
                <MonacoEditor intent="payload" language="json" value='{"a":1}' height="100%" />
            </HeightHost>,
        )

        const textarea = screen.getByDisplayValue('{"a":1}')
        fireEvent.focus(textarea)
        fireEvent.blur(textarea)

        const editor = await screen.findByTestId("dynamic-monaco-editor")
        await waitFor(() => {
            expect(editor.getAttribute("data-height")).toBe("640px")
        })
        expect(editor.parentElement).toHaveAttribute("data-input-intent", "payload")
    })

    it("resolves percentage height to parent pixel height for MonacoDiffEditor", async () => {
        renderWithLang(
            <HeightHost height={560}>
                <MonacoDiffEditor intent="workbench" language="text" original="a" modified="b" height="100%" />
            </HeightHost>,
        )

        fireEvent.focus(screen.getByDisplayValue("a"))

        const editor = await screen.findByTestId("dynamic-monaco-diff")
        await waitFor(() => {
            expect(editor.getAttribute("data-height")).toBe("560px")
        })
        expect(editor.parentElement).toHaveAttribute("data-input-intent", "workbench")
    })

    it("keeps textarea fallback active during the first desktop interaction and upgrades after blur", async () => {
        renderWithLang(<MonacoEditor language="json" value='{"a":1}' />)

        expect(screen.getByDisplayValue('{"a":1}')).toBeInTheDocument()
        expect(screen.queryByTestId("dynamic-monaco-editor")).not.toBeInTheDocument()

        const textarea = screen.getByDisplayValue('{"a":1}')
        fireEvent.pointerDown(textarea)

        expect(screen.getByDisplayValue('{"a":1}')).toBeInTheDocument()
        expect(screen.queryByTestId("dynamic-monaco-editor")).not.toBeInTheDocument()

        fireEvent.blur(textarea)

        await screen.findByTestId("dynamic-monaco-editor")
    })

    it("preserves fallback typing during desktop Monaco activation before upgrading on blur", async () => {
        function Harness() {
            const [value, setValue] = React.useState('{"a":1}')
            return <MonacoEditor language="json" value={value} onChange={(next) => setValue(next || "")} />
        }

        renderWithLang(<Harness />)

        const textarea = screen.getByDisplayValue('{"a":1}')
        fireEvent.focus(textarea)
        fireEvent.change(textarea, { target: { value: '{"a":2}' } })

        expect(screen.getByDisplayValue('{"a":2}')).toBeInTheDocument()
        expect(screen.queryByTestId("dynamic-monaco-editor")).not.toBeInTheDocument()

        fireEvent.blur(screen.getByDisplayValue('{"a":2}'))

        await screen.findByTestId("dynamic-monaco-editor")
    })
})
