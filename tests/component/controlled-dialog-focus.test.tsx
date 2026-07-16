import * as React from "react"
import { act, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CommandPalette } from "@/components/layout/command-palette"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getEnglishToolSearchAliases, getTranslation } from "@/core/i18n/translations/catalog"
import { JsonFormatterPage } from "@/features/tools/json-formatter/page"
import { JsonTreeEditDialog } from "@/features/tools/json-formatter/panels"
import type { TreeDialogState } from "@/features/tools/json-formatter/types"
import { useDialogReturnFocus } from "@/hooks/use-dialog-return-focus"

const pushMock = vi.hoisted(() => vi.fn())

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock)
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
})

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/json-formatter",
    useRouter: () => ({ push: pushMock, replace: pushMock }),
}))

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>{children}</a>
    ),
}))

vi.mock("@/core/commands/registry", () => ({
    useSystemCommands: () => [],
}))

function renderEnglish(ui: React.ReactNode) {
    return render(
        <LangProvider
            lang="en"
            translations={getTranslation("en")}
            englishToolSearchAliases={getEnglishToolSearchAliases()}
        >
            {ui}
        </LangProvider>,
    )
}

function expectDialogFocusToWrap(first: HTMLElement, last: HTMLElement) {
    last.focus()
    fireEvent.keyDown(last, { key: "Tab" })
    expect(first).toHaveFocus()

    first.focus()
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true })
    expect(last).toHaveFocus()
}

function JsonDialogHarness() {
    const [dialog, setDialog] = React.useState<TreeDialogState>(null)
    const { captureReturnFocus, restoreReturnFocus } = useDialogReturnFocus()
    const labels: Record<string, string> = {
        tree_edit_value_title: "Edit JSON Value",
        tree_edit_value_description: "Enter a valid JSON literal value.",
    }

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    captureReturnFocus()
                    setDialog({ type: "edit_value", path: ["name"], draft: '"byteflow"' })
                }}
            >
                Edit node
            </button>
            <JsonTreeEditDialog
                applyLabel="Apply"
                closeLabel="Close"
                dialog={dialog}
                onClose={() => setDialog(null)}
                onCloseAutoFocus={restoreReturnFocus}
                onDraftChange={(draft) => setDialog((current) => current ? { ...current, draft } : null)}
                onSubmit={() => setDialog(null)}
                text={(key) => labels[key] ?? key}
            />
        </>
    )
}

function ControlledCommandPaletteHarness() {
    const [open, setOpen] = React.useState(false)
    const returnFocusRef = React.useRef<HTMLElement | null>(null)
    const takeReturnFocusTarget = React.useCallback(() => {
        const focusTarget = returnFocusRef.current
        returnFocusRef.current = null
        return focusTarget
    }, [])

    return (
        <>
            <button
                type="button"
                onClick={(event) => {
                    returnFocusRef.current = event.currentTarget
                    setOpen(true)
                }}
            >
                Command origin
            </button>
            <CommandPalette
                open={open}
                onOpenChange={setOpen}
                enableShortcut={false}
                takeReturnFocusTarget={takeReturnFocusTarget}
            />
        </>
    )
}

describe("controlled dialog focus restoration", () => {
    beforeEach(() => {
        pushMock.mockReset()
        window.localStorage.clear()
    })

    it("returns Command Palette focus after Escape", async () => {
        renderEnglish(<ControlledCommandPaletteHarness />)

        const origin = screen.getByRole("button", { name: "Command origin" })
        origin.focus()
        fireEvent.click(origin)

        const dialog = await screen.findByRole("dialog", { name: "Navigation" })
        expect(dialog).toHaveAccessibleDescription("Search tools...")
        const searchInput = within(dialog).getByRole("combobox", { name: "Search tools..." })
        await waitFor(() => expect(searchInput).toHaveFocus())
        const closeButton = within(dialog).getByRole("button", { name: "Close" })
        expectDialogFocusToWrap(searchInput, closeButton)

        fireEvent.keyDown(document, { key: "Escape" })

        await waitFor(() => expect(screen.queryByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument())
        await waitFor(() => expect(origin).toHaveFocus())
    })

    it("names the JSON editor and returns focus to its actual opener", async () => {
        renderEnglish(<JsonDialogHarness />)

        const origin = screen.getByRole("button", { name: "Edit node" })
        origin.focus()
        fireEvent.click(origin)

        const dialog = await screen.findByRole("dialog", { name: "Edit JSON Value" })
        expect(dialog).toHaveAccessibleDescription("Enter a valid JSON literal value.")
        const editor = within(dialog).getByRole("textbox", { name: "Edit JSON Value" })
        await waitFor(() => expect(editor).toHaveFocus())
        const closeButton = within(dialog).getAllByRole("button", { name: "Close" }).at(-1)!
        expectDialogFocusToWrap(editor, closeButton)

        fireEvent.keyDown(document, { key: "Escape" })

        await waitFor(() => expect(screen.queryByRole("dialog", { name: "Edit JSON Value" })).not.toBeInTheDocument())
        await waitFor(() => expect(origin).toHaveFocus())
    })

    it("returns JSON key rename focus to the renamed key action", async () => {
        renderEnglish(<JsonFormatterPage />)

        fireEvent.change(screen.getByRole("textbox", { name: "Input" }), {
            target: { value: '{"name":"byteflow"}' },
        })
        fireEvent.click(screen.getByRole("button", { name: "Tree" }))

        const origin = await screen.findByRole("button", { name: "Rename key" })
        origin.focus()
        fireEvent.click(origin)

        const dialog = await screen.findByRole("dialog", { name: "Rename Object Key" })
        const keyInput = within(dialog).getByRole("textbox", { name: "Rename Object Key" })
        await waitFor(() => expect(keyInput).toHaveFocus())

        fireEvent.change(keyInput, { target: { value: "displayName" } })
        fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }))

        await waitFor(() => expect(screen.queryByRole("dialog", { name: "Rename Object Key" })).not.toBeInTheDocument())
        expect(origin.isConnected).toBe(false)

        const renamedAction = screen.getByRole("button", { name: "Rename key" })
        await waitFor(() => expect(renamedAction).toHaveFocus())
        expect(document.activeElement).not.toBe(document.body)
    })

    it("uses a connected fallback when the captured return target is removed", () => {
        const { result } = renderHook(() => useDialogReturnFocus())
        const capturedTarget = document.createElement("button")
        const fallbackTarget = document.createElement("button")
        document.body.append(capturedTarget, fallbackTarget)
        capturedTarget.focus()

        act(() => result.current.captureReturnFocus())
        capturedTarget.remove()
        act(() => result.current.setReturnFocusFallback(() => fallbackTarget))

        const closeAutoFocusEvent = new Event("closeAutoFocus", { cancelable: true })
        act(() => result.current.restoreReturnFocus(closeAutoFocusEvent))

        expect(closeAutoFocusEvent.defaultPrevented).toBe(true)
        expect(fallbackTarget).toHaveFocus()
        fallbackTarget.remove()
    })

    it("preserves Radix default restoration without a connected return target", () => {
        const { result } = renderHook(() => useDialogReturnFocus())
        const missingTargetEvent = new Event("closeAutoFocus", { cancelable: true })

        act(() => result.current.restoreReturnFocus(missingTargetEvent))
        expect(missingTargetEvent.defaultPrevented).toBe(false)

        act(() => result.current.captureReturnFocus(document.body))
        const bodyTargetEvent = new Event("closeAutoFocus", { cancelable: true })
        act(() => result.current.restoreReturnFocus(bodyTargetEvent))
        expect(bodyTargetEvent.defaultPrevented).toBe(false)

        const detachedTarget = document.createElement("button")
        act(() => result.current.captureReturnFocus(detachedTarget))
        const detachedTargetEvent = new Event("closeAutoFocus", { cancelable: true })

        act(() => result.current.restoreReturnFocus(detachedTargetEvent))
        expect(detachedTargetEvent.defaultPrevented).toBe(false)
    })
})
