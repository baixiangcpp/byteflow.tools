import { render, screen, within } from "@testing-library/react"
import { Copy, Download, Eraser, Play, TestTube2 } from "lucide-react"
import { describe, expect, it, vi } from "vitest"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"

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

vi.mock("@/core/i18n/lang-provider", () => ({
    useLang: () => ({
        lang: "en",
        t: {
            common: {
                action_disabled_no_output: "Run the tool first to create output.",
                action_disabled_unavailable: "This action is unavailable right now.",
                recommended_tools: "Recommended Tools",
                send_to: "Send to...",
            },
        },
    }),
}))

describe("ToolActionBar", () => {
    it("orders common actions and exposes disabled reasons", () => {
        const actions: ToolAction[] = [
            { id: "download", label: "Download", icon: Download, disabled: true, disabledReason: "Nothing to download." },
            { id: "copy", label: "Copy", icon: Copy },
            { id: "format", label: "Format", icon: Play },
            { id: "clear", label: "Clear", icon: Eraser },
            { id: "sample", label: "Sample", icon: TestTube2 },
        ]

        render(<ToolActionBar actions={actions} />)

        const toolbar = screen.getByRole("button", { name: "Sample" }).parentElement
        expect(toolbar).not.toBeNull()
        const labels = within(toolbar!).getAllByRole("button").map((button) => button.textContent)

        expect(labels).toEqual(["Sample", "Clear", "Format", "Copy", "Download"])
        expect(screen.getByRole("button", { name: "Download", description: ": Nothing to download." })).toHaveAttribute("title", "Download: Nothing to download.")
    })

    it("marks clear and reset style actions as destructive", () => {
        render(<ToolActionBar actions={[{ id: "clear", label: "Clear", icon: Eraser }]} />)

        expect(screen.getByRole("button", { name: "Clear" }).className).toContain("text-destructive")
    })

    it("falls back to a generic disabled reason when a tool omits one", () => {
        render(<ToolActionBar actions={[{ id: "download", label: "Download", icon: Download, disabled: true }]} />)

        expect(screen.getByRole("button", { name: "Download", description: ": This action is unavailable right now." })).toBeDisabled()
    })
})
