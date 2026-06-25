import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
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
                action_status_failed: "{action} failed.",
                action_status_pending: "{action} in progress.",
                action_status_success: "{action} completed.",
                recommended_tools: "Recommended Tools",
                send_to: "Send to...",
                tool_actions: "Tool actions",
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

        const toolbar = screen.getByRole("toolbar", { name: "Tool actions" })
        const labels = within(toolbar).getAllByRole("button").map((button) => button.textContent)

        expect(labels).toEqual(["Sample", "Clear", "Format", "Copy", "Download"])
        expect(screen.getByRole("button", { name: "Download", description: "Nothing to download." })).toHaveAttribute("title", "Download: Nothing to download.")
    })

    it("marks clear and reset style actions as destructive", () => {
        render(<ToolActionBar actions={[{ id: "clear", label: "Clear", icon: Eraser }]} />)

        expect(screen.getByRole("button", { name: "Clear" }).className).toContain("text-destructive")
    })

    it("uses optional titles for tooltips without changing accessible names", () => {
        render(<ToolActionBar actions={[{ id: "sample", label: "Sample", icon: TestTube2, title: "Restore the documented sample." }]} />)

        expect(screen.getByRole("button", { name: "Sample" })).toHaveAttribute("title", "Restore the documented sample.")
    })

    it("falls back to a generic disabled reason when a tool omits one", () => {
        render(<ToolActionBar actions={[{ id: "download", label: "Download", icon: Download, disabled: true }]} />)

        expect(screen.getByRole("button", { name: "Download", description: "This action is unavailable right now." })).toBeDisabled()
    })

    it("exposes shared idle, disabled, pending, success, and failed action states", async () => {
        let resolveCopy: (value: { status: "success"; message: string }) => void = () => undefined
        let resolveFormat: (value: { status: "failed"; message: string }) => void = () => undefined

        render(<ToolActionBar actions={[
            { id: "sample", label: "Sample", icon: TestTube2 },
            { id: "download", label: "Download", icon: Download, disabled: true },
            {
                id: "copy",
                label: "Copy",
                icon: Copy,
                onClick: () => new Promise<{ status: "success"; message: string }>((resolve) => {
                    resolveCopy = resolve
                }),
            },
            {
                id: "format",
                label: "Format",
                icon: Play,
                onClick: () => new Promise<{ status: "failed"; message: string }>((resolve) => {
                    resolveFormat = resolve
                }),
            },
        ]} />)

        expect(screen.getByRole("button", { name: "Sample" })).toHaveAttribute("data-tool-action-state", "idle")
        expect(screen.getByRole("button", { name: "Download" })).toHaveAttribute("data-tool-action-state", "disabled")

        fireEvent.click(screen.getByRole("button", { name: "Copy" }))
        expect(screen.getByRole("button", { name: "Copy" })).toHaveAttribute("data-tool-action-state", "pending")
        await act(async () => {
            resolveCopy({ status: "success", message: "Copied" })
        })
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Copy" })).toHaveAttribute("data-tool-action-state", "success")
        })
        expect(screen.getByText("Copied")).toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Format" }))
        expect(screen.getByRole("button", { name: "Format" })).toHaveAttribute("data-tool-action-state", "pending")
        await act(async () => {
            resolveFormat({ status: "failed", message: "Format failed" })
        })
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Format" })).toHaveAttribute("data-tool-action-state", "failed")
        })
        expect(screen.getByText("Format failed")).toBeInTheDocument()
    })

    it("describes disabled handoff actions without changing their accessible name", () => {
        render(<ToolActionBar actions={[{ id: "to_json", label: "JSON Formatter", icon: Copy, href: "/en/json-formatter" }]} />)

        expect(screen.getByRole("button", {
            name: "Send to...",
            description: "Run the tool first to create output.",
        })).toBeDisabled()
    })
})
