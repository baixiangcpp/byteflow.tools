import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { JsonFormatterPage } from "@/features/tools/json-formatter/page"

const downloadJsonOutputMock = vi.fn()

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/json-formatter",
}))

vi.mock("@/features/tools/json-formatter/browser-actions", () => ({
    downloadJsonOutput: (content: string, filename: string) => downloadJsonOutputMock(content, filename),
}))

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}))

function renderJsonFormatter() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <JsonFormatterPage />
        </LangProvider>,
    )
}

function inputEditor() {
    return screen.getByRole("textbox", { name: "Input" })
}

function outputEditor() {
    return screen.getByRole("textbox", { name: "Output" })
}

function installMatchMedia(matches: boolean) {
    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: vi.fn(() => ({
            matches,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })),
    })
}

class IdleJsonWorker {
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null

    postMessage() {}
    terminate() {}
}

describe("JsonFormatterPage actions", () => {
    beforeEach(() => {
        downloadJsonOutputMock.mockClear()
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: {
                getItem: () => null,
                setItem: vi.fn(),
                removeItem: vi.fn(),
            },
        })
        installMatchMedia(true)
        window.history.replaceState(null, "", "/en/json-formatter")
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("clears stale output when invalid JSON replaces valid output", async () => {
        renderJsonFormatter()

        fireEvent.change(inputEditor(), { target: { value: '{"ok":true}' } })
        fireEvent.click(screen.getByRole("button", { name: "Format" }))

        await waitFor(() => {
            expect(outputEditor()).toHaveValue("{\n  \"ok\": true\n}")
        })
        expect(screen.getAllByRole("button", { name: "Download JSON" }).some((button) => !button.hasAttribute("disabled"))).toBe(true)

        fireEvent.change(inputEditor(), { target: { value: '{"ok":true,}' } })
        expect(screen.queryByDisplayValue("{\n  \"ok\": true\n}")).not.toBeInTheDocument()
        expect(screen.getAllByRole("button", { name: "Download JSON", description: "Run the tool first to create output." }).every((button) => button.hasAttribute("disabled"))).toBe(true)

        fireEvent.click(screen.getByRole("button", { name: "Format" }))
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent(/Line:Column|Invalid JSON/)
        })
        expect(screen.getByRole("button", { name: "Download JSON", description: "Fix invalid JSON before downloading." })).toBeDisabled()

        fireEvent.change(inputEditor(), { target: { value: '{"ok":false}' } })
        fireEvent.click(screen.getByRole("button", { name: "Format" }))
        await waitFor(() => {
            expect(outputEditor()).toHaveValue("{\n  \"ok\": false\n}")
        })
        expect(screen.getAllByRole("button", { name: "Download JSON" }).some((button) => !button.hasAttribute("disabled"))).toBe(true)
    })

    it.each(["Format", "Minify"])("does not announce %s success when invalid JSON raises an alert", async (action) => {
        renderJsonFormatter()

        fireEvent.change(inputEditor(), { target: { value: '{"name":}' } })
        fireEvent.click(screen.getByRole("button", { name: action }))

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent(/Unexpected token|Invalid JSON/)
        })
        await waitFor(() => {
            expect(screen.getByRole("button", { name: action })).not.toHaveAttribute("aria-busy")
        })
        expect(screen.queryByText(`${action} completed.`)).not.toBeInTheDocument()
    })

    it.each([
        { action: "Format", shiftKey: false, output: "{\n  \"ok\": true\n}" },
        { action: "Minify", shiftKey: true, output: "{\"ok\":true}" },
    ])("announces $action success when triggered by its keyboard shortcut", async ({ action, shiftKey, output }) => {
        renderJsonFormatter()

        const editor = inputEditor()
        fireEvent.change(editor, { target: { value: '{"ok":true}' } })
        const editorKeyDown = vi.fn((event: KeyboardEvent) => event.stopPropagation())
        editor.addEventListener("keydown", editorKeyDown, { once: true })
        fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true, shiftKey })

        await waitFor(() => expect(outputEditor()).toHaveValue(output))
        expect(screen.getByText(`${action} completed.`)).toBeInTheDocument()
        expect(editorKeyDown).not.toHaveBeenCalled()
    })

    it.each([
        { announcement: null, label: "input editing", mutate: () => fireEvent.change(inputEditor(), { target: { value: '{"next":true}' } }) },
        { announcement: "Clear completed.", label: "Clear", mutate: () => fireEvent.click(screen.getByRole("button", { name: "Clear" })) },
    ])("cancels a pending format after $label without restoring stale output", async ({ announcement, mutate }) => {
        vi.stubGlobal("Worker", IdleJsonWorker)
        renderJsonFormatter()

        fireEvent.change(inputEditor(), { target: { value: '{"stale":true}' } })
        fireEvent.click(screen.getByRole("button", { name: "Format" }))
        await waitFor(() => expect(screen.getByRole("button", { name: "Format" })).toHaveAttribute("aria-busy", "true"))

        mutate()

        await waitFor(() => expect(screen.getByRole("button", { name: "Format" })).not.toHaveAttribute("aria-busy"))
        expect(screen.queryByRole("textbox", { name: "Output" })).not.toBeInTheDocument()
        expect(screen.queryByText(/"stale"/)).not.toBeInTheDocument()
        expect(screen.queryByText("Format completed.")).not.toBeInTheDocument()
        if (announcement) expect(screen.getByRole("status")).toHaveTextContent(announcement)
    })

    it("cancels a pending format before applying a tree edit", async () => {
        vi.stubGlobal("Worker", IdleJsonWorker)
        renderJsonFormatter()

        fireEvent.change(inputEditor(), { target: { value: '{"stale":true}' } })
        fireEvent.click(screen.getByRole("button", { name: "Tree" }))
        fireEvent.click(screen.getByRole("button", { name: "Format" }))
        await waitFor(() => expect(screen.getByRole("button", { name: "Format" })).toHaveAttribute("aria-busy", "true"))

        fireEvent.click(screen.getByRole("button", { name: "Delete node" }))

        await waitFor(() => expect(screen.getByRole("button", { name: "Format" })).not.toHaveAttribute("aria-busy"))
        expect(inputEditor()).toHaveValue("{}")
        expect(screen.queryByText("Format completed.")).not.toBeInTheDocument()
    })

    it.each([
        { label: "mobile", matches: true },
        { label: "desktop", matches: false },
    ])("downloads formatted and minified JSON with JSON filenames on $label", async ({ matches }) => {
        installMatchMedia(matches)
        renderJsonFormatter()

        fireEvent.change(inputEditor(), { target: { value: '{"ok":true}' } })
        fireEvent.click(screen.getByRole("button", { name: "Format" }))
        await waitFor(() => expect(screen.getAllByRole("button", { name: "Download JSON" }).some((button) => !button.hasAttribute("disabled"))).toBe(true))
        expect(screen.getByText("Format completed.")).toBeInTheDocument()

        act(() => {
            screen.getAllByRole("button", { name: "Download JSON" }).at(-1)?.click()
        })
        expect(downloadJsonOutputMock).toHaveBeenLastCalledWith("{\n  \"ok\": true\n}", "formatted.json")

        fireEvent.click(screen.getByRole("button", { name: "Minify" }))
        await waitFor(() => expect(outputEditor()).toHaveValue("{\"ok\":true}"))
        expect(screen.getByText("Minify completed.")).toBeInTheDocument()

        act(() => {
            screen.getAllByRole("button", { name: "Download JSON" }).at(-1)?.click()
        })
        expect(downloadJsonOutputMock).toHaveBeenLastCalledWith("{\"ok\":true}", "minified.json")
    })
})
