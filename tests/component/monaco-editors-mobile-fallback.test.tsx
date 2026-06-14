import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { LangProvider } from "@/core/i18n/lang-provider"
import { MonacoDiffEditor, MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { getTranslation } from "@/core/i18n/translations/catalog"

function installMobileMatchMedia() {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
            matches: true,
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

function renderWithLang(ui: React.ReactElement) {
    return render(<LangProvider lang="en" translations={getTranslation("en")}>{ui}</LangProvider>)
}

describe("monaco editors mobile fallback", () => {
    beforeEach(() => {
        installMobileMatchMedia()
    })

    it("renders textarea fallback for MonacoEditor and emits changes", async () => {
        const onChange = vi.fn()
        renderWithLang(
            <MonacoEditor
                language="json"
                value='{"a":1}'
                onChange={onChange}
                options={{ readOnly: false }}
            />,
        )

        const textarea = await screen.findByDisplayValue('{"a":1}')
        fireEvent.change(textarea, { target: { value: '{"a":2}' } })

        await waitFor(() => {
            expect(onChange).toHaveBeenCalled()
        })
        expect(onChange.mock.calls[0]?.[0]).toBe('{"a":2}')
    })

    it("renders dual textarea fallback for MonacoDiffEditor", async () => {
        const onOriginalChange = vi.fn()
        const onModifiedChange = vi.fn()

        renderWithLang(
            <MonacoDiffEditor
                language="text"
                original="alpha"
                modified="beta"
                onOriginalChange={onOriginalChange}
                onModifiedChange={onModifiedChange}
                options={{ readOnly: false, originalEditable: true }}
            />,
        )

        await screen.findByDisplayValue("alpha")
        const original = screen.getByDisplayValue("alpha")
        const modified = screen.getByDisplayValue("beta")

        fireEvent.change(original, { target: { value: "alpha-2" } })
        fireEvent.change(modified, { target: { value: "beta-2" } })

        await waitFor(() => {
            expect(onOriginalChange).toHaveBeenCalledWith("alpha-2")
            expect(onModifiedChange).toHaveBeenCalledWith("beta-2")
        })
    })
})
