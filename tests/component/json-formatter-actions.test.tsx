import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
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

    it.each([
        { label: "mobile", matches: true },
        { label: "desktop", matches: false },
    ])("downloads formatted and minified JSON with JSON filenames on $label", async ({ matches }) => {
        installMatchMedia(matches)
        renderJsonFormatter()

        fireEvent.change(inputEditor(), { target: { value: '{"ok":true}' } })
        fireEvent.click(screen.getByRole("button", { name: "Format" }))
        await waitFor(() => expect(screen.getAllByRole("button", { name: "Download JSON" }).some((button) => !button.hasAttribute("disabled"))).toBe(true))

        act(() => {
            screen.getAllByRole("button", { name: "Download JSON" }).at(-1)?.click()
        })
        expect(downloadJsonOutputMock).toHaveBeenLastCalledWith("{\n  \"ok\": true\n}", "formatted.json")

        fireEvent.click(screen.getByRole("button", { name: "Minify" }))
        await waitFor(() => expect(outputEditor()).toHaveValue("{\"ok\":true}"))

        act(() => {
            screen.getAllByRole("button", { name: "Download JSON" }).at(-1)?.click()
        })
        expect(downloadJsonOutputMock).toHaveBeenLastCalledWith("{\"ok\":true}", "minified.json")
    })
})
