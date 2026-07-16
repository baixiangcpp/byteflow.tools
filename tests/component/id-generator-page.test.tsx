import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { IdGeneratorPage } from "@/features/tools/id-generator/page"

const clipboardWriteMock = vi.fn()

vi.mock("uuid", () => ({
    v4: vi.fn(() => "44444444-4444-4444-8444-444444444444"),
}))

vi.mock("@/core/clipboard/clipboard", () => ({
    safeClipboardWrite: (value: string) => clipboardWriteMock(value),
}))

vi.mock("@/core/seo/components/related-tools", () => ({
    RelatedTools: () => null,
}))

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock("@/components/ui/select", async () => {
    const React = await import("react")
    const SelectContext = React.createContext<{
        value?: string
        onValueChange?: (value: string) => void
    } | null>(null)

    function Select({
        value,
        onValueChange,
        children,
    }: {
        value?: string
        onValueChange?: (value: string) => void
        children: ReactNode
    }) {
        return <SelectContext.Provider value={{ value, onValueChange }}>{children}</SelectContext.Provider>
    }

    function SelectTrigger({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
        return <button type="button" {...props}>{children}</button>
    }

    function SelectContent({ children }: { children: ReactNode }) {
        return <>{children}</>
    }

    function SelectItem({ value, children, ...props }: HTMLAttributes<HTMLDivElement> & { value: string }) {
        const context = React.useContext(SelectContext)
        return (
            <div
                role="option"
                aria-selected={context?.value === value}
                onClick={() => context?.onValueChange?.(value)}
                {...props}
            >
                {children}
            </div>
        )
    }

    return {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue: () => null,
    }
})

function renderPage() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <IdGeneratorPage />
        </LangProvider>,
    )
}

function makeAlphabet(length: number): string {
    return Array.from({ length }, (_, index) => String.fromCodePoint(0x1000 + index)).join("")
}

describe("IdGeneratorPage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        clipboardWriteMock.mockResolvedValue({ ok: true })
    })

    it("rejects blank batch quantity without leaving copyable output", async () => {
        renderPage()
        await waitFor(() => expect(screen.getByText("Generated IDs (5)")).toBeInTheDocument())

        const quantity = screen.getByLabelText("Quantity (1-1000)")
        fireEvent.change(quantity, { target: { value: "" } })

        expect(quantity).toHaveAttribute("aria-invalid", "true")
        expect(screen.getByRole("alert")).toHaveTextContent("Quantity must be a whole number from 1 to 1000.")
        expect(screen.getByRole("button", { name: "Regenerate" })).toBeDisabled()
        expect(screen.getByRole("button", { name: "Copy All" })).toBeDisabled()
        expect(screen.getByRole("textbox", { name: "Generated IDs" })).toHaveValue("")

        fireEvent.click(screen.getByRole("button", { name: "Copy All" }))
        expect(clipboardWriteMock).not.toHaveBeenCalled()

        fireEvent.change(quantity, { target: { value: "2" } })
        await waitFor(() => expect(screen.getByText("Generated IDs (2)")).toBeInTheDocument())
        expect(quantity).not.toHaveAttribute("aria-invalid")
        expect(screen.getByRole("button", { name: "Regenerate" })).toBeEnabled()
    })

    it("reports unsafe alphabets instead of throwing from the generation effect", async () => {
        renderPage()
        fireEvent.click(screen.getByRole("option", { name: "NanoID" }))

        const alphabet = await screen.findByLabelText("Alphabet (2-256 unique Unicode code points)")
        fireEvent.change(alphabet, { target: { value: "" } })
        expect(screen.getByText("Alphabet must contain at least 2 unique Unicode code points.")).toBeInTheDocument()
        expect(screen.getByText("Generated IDs (0)")).toBeInTheDocument()

        fireEvent.change(alphabet, { target: { value: "aab" } })
        expect(screen.getByText("Alphabet must not contain duplicate Unicode code points.")).toBeInTheDocument()

        fireEvent.change(alphabet, { target: { value: makeAlphabet(257) } })
        expect(screen.getByText("Alphabet cannot contain more than 256 Unicode code points.")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Regenerate" })).toBeDisabled()
        expect(screen.getByRole("button", { name: "Copy All" })).toBeDisabled()
    })

    it("generates complete non-BMP symbols after invalid settings are corrected", async () => {
        renderPage()
        fireEvent.click(screen.getByRole("option", { name: "NanoID" }))

        const quantity = screen.getByLabelText("Quantity (1-1000)")
        const size = await screen.findByLabelText("Length (1-256)")
        const alphabet = screen.getByLabelText("Alphabet (2-256 unique Unicode code points)")

        fireEvent.change(size, { target: { value: "" } })
        expect(size).toHaveAttribute("aria-invalid", "true")
        expect(screen.getByText("NanoID length must be a whole number from 1 to 256.")).toBeInTheDocument()

        fireEvent.change(quantity, { target: { value: "1" } })
        fireEvent.change(size, { target: { value: "4" } })
        fireEvent.change(alphabet, { target: { value: "😀🚀" } })

        const output = screen.getByRole("textbox", { name: "Generated IDs" })
        await waitFor(() => expect(Array.from((output as HTMLTextAreaElement).value)).toHaveLength(4))
        expect(Array.from((output as HTMLTextAreaElement).value).every((symbol) => ["😀", "🚀"].includes(symbol))).toBe(true)
        expect(screen.getByRole("button", { name: "Copy All" })).toBeEnabled()
    })
})
