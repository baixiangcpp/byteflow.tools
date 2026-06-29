import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { ExternalRequestStatus } from "@/features/tool-shell/external-request-status"
import { TextOutputPanel } from "@/features/tool-shell/text-output-panel"
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

function renderEnglish(ui: React.ReactNode) {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            {ui}
        </LangProvider>,
    )
}

describe("shared tool shell status and output components", () => {
    it("announces action pending and returned success/failure states once through the shared toolbar live region", async () => {
        const actions: ToolAction[] = [
            {
                id: "copy",
                label: "Copy",
                onClick: async () => ({ status: "success", message: "Copied to clipboard", description: "Output copied." }),
            },
            {
                id: "download",
                label: "Download",
                onClick: async () => ({ status: "failed", message: "Download failed", description: "Try again." }),
            },
        ]

        renderEnglish(<ToolActionBar actions={actions} />)

        fireEvent.click(screen.getByRole("button", { name: "Copy" }))
        await waitFor(() => {
            expect(screen.getByRole("status")).toHaveTextContent("Copied to clipboard. Output copied.")
        })

        fireEvent.click(screen.getByRole("button", { name: "Download" }))
        await waitFor(() => {
            expect(screen.getByRole("status")).toHaveTextContent("Download failed. Try again.")
        })
    })

    it("does not announce async Promise<void> actions as successful without a returned result", async () => {
        const actions: ToolAction[] = [
            {
                id: "verify",
                label: "Verify",
                onClick: async () => undefined,
            },
        ]

        renderEnglish(<ToolActionBar actions={actions} />)

        fireEvent.click(screen.getByRole("button", { name: "Verify" }))

        await waitFor(() => {
            expect(screen.queryByRole("status")).not.toBeInTheDocument()
        })
        expect(screen.getByRole("button", { name: "Verify" })).toHaveAttribute("data-tool-action-state", "idle")
    })

    it("lets long output switch between wrap and horizontal scroll modes without changing the output text", () => {
        const output = `https://example.com/${"a".repeat(180)}`

        renderEnglish(<TextOutputPanel title="Output" value={output} />)

        const outputRegion = screen.getByLabelText("Output")
        expect(outputRegion).toHaveAttribute("data-output-overflow-mode", "wrap")
        expect(outputRegion).toHaveTextContent(output)

        fireEvent.click(screen.getByRole("radio", { name: "Scroll" }))
        expect(outputRegion).toHaveAttribute("data-output-overflow-mode", "scroll")
        expect(outputRegion).toHaveTextContent(output)
    })

    it("lets keyboard users switch long output wrap modes with radio navigation keys", () => {
        const output = `https://example.com/${"a".repeat(180)}`

        renderEnglish(<TextOutputPanel title="Output" value={output} />)

        const outputRegion = screen.getByLabelText("Output")
        const wrapRadio = screen.getByRole("radio", { name: "Wrap" })
        expect(outputRegion).toHaveAttribute("data-output-overflow-mode", "wrap")

        fireEvent.keyDown(wrapRadio, { key: "ArrowRight" })
        expect(outputRegion).toHaveAttribute("data-output-overflow-mode", "scroll")
        expect(screen.getByRole("radio", { name: "Scroll" })).toHaveFocus()

        fireEvent.keyDown(screen.getByRole("radio", { name: "Scroll" }), { key: "Home" })
        expect(outputRegion).toHaveAttribute("data-output-overflow-mode", "wrap")
        expect(wrapRadio).toHaveFocus()

        fireEvent.keyDown(wrapRadio, { key: "End" })
        expect(outputRegion).toHaveAttribute("data-output-overflow-mode", "scroll")
    })

    it("announces permission external request states politely while keeping failures assertive", () => {
        const { rerender } = renderEnglish(
            <ExternalRequestStatus
                status="permission"
                message="Confirm before previewing external media."
                nextStep="Confirm the external request."
                hosts={["i.ytimg.com"]}
            />,
        )

        const permissionStatus = screen.getByRole("status")
        expect(permissionStatus).toHaveAttribute("data-external-request-status", "permission")
        expect(permissionStatus).toHaveAttribute("aria-live", "polite")

        rerender(
            <LangProvider lang="en" translations={getTranslation("en")}>
                <ExternalRequestStatus
                    status="offline"
                    message="This external-request action needs network access."
                    nextStep="Reconnect and retry."
                    hosts={["i.ytimg.com"]}
                />
            </LangProvider>,
        )

        expect(screen.getByRole("alert")).toHaveAttribute("data-external-request-status", "offline")
        expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive")
    })

    it("exposes external request status, next step, hosts, and alert semantics for failures", () => {
        renderEnglish(
            <ExternalRequestStatus
                status="offline"
                message="This external-request action needs network access."
                nextStep="Reconnect and retry."
                hosts={["i.ytimg.com"]}
            />,
        )

        expect(screen.getByRole("alert")).toHaveAttribute("data-external-request-status", "offline")
        expect(screen.getByRole("alert")).toHaveTextContent("What to do next: Reconnect and retry.")
        expect(screen.getByRole("alert")).toHaveTextContent("i.ytimg.com")
        expect(screen.getByRole("alert")).toHaveTextContent("Network access starts only after you choose the external-request action.")
    })
})
