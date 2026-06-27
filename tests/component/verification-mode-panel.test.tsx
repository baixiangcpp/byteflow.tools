import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { VerificationModePanel } from "@/components/layout/verification-mode-panel"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

function renderPanel(pathname = "/en/json-formatter") {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <VerificationModePanel pathname={pathname} />
        </LangProvider>,
    )
}

function openPanel() {
    fireEvent.click(screen.getByRole("button", { name: "Verification mode" }))
}

describe("VerificationModePanel", () => {
    const originalFetch = window.fetch
    const originalSendBeacon = navigator.sendBeacon

    beforeEach(() => {
        window.history.replaceState(null, "", "/en/json-formatter")
        window.fetch = vi.fn(() => Promise.resolve(new Response("ok"))) as typeof window.fetch
        navigator.sendBeacon = vi.fn(() => true)
        window.localStorage.clear()
        window.sessionStorage.clear()
    })

    afterEach(() => {
        window.fetch = originalFetch
        navigator.sendBeacon = originalSendBeacon
        vi.restoreAllMocks()
    })

    it("shows current browser-local tool state with zero observed requests", () => {
        renderPanel()
        openPanel()

        expect(screen.getByRole("complementary", { name: "Verification mode" })).toBeInTheDocument()
        expect(screen.getByText("Browser-local tool")).toBeInTheDocument()
        expect(screen.getByText("0 requests observed")).toBeInTheDocument()
        expect(screen.getByText("External hosts: No external hosts observed")).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Trust Center verification steps" })).toHaveAttribute(
            "href",
            "/en/trust-center#verify-local-processing",
        )
    })

    it("records request hosts without displaying query strings, bodies, or headers", async () => {
        renderPanel()
        openPanel()

        fireEvent.click(screen.getByRole("button", { name: "Off" }))
        await window.fetch("https://api.example.com/lookup?token=secret-token", {
            method: "POST",
            body: "raw-secret-body",
            headers: { Authorization: "Bearer secret" },
        })
        navigator.sendBeacon("https://analytics.example.com/collect?payload=secret", "secret-beacon-body")

        await waitFor(() => expect(screen.getByText("2 requests observed")).toBeInTheDocument())
        expect(screen.getByText("External hosts: https://analytics.example.com, https://api.example.com")).toBeInTheDocument()
        expect(document.body).not.toHaveTextContent("secret-token")
        expect(document.body).not.toHaveTextContent("raw-secret-body")
        expect(document.body).not.toHaveTextContent("Bearer secret")
        expect(document.body).not.toHaveTextContent("secret-beacon-body")
    })

    it("records storage keys without displaying stored values and supports clearing the visible log", async () => {
        renderPanel()
        openPanel()

        fireEvent.click(screen.getByRole("button", { name: "Off" }))
        window.localStorage.setItem("byteflow:test:key", "secret-value")
        window.sessionStorage.setItem("third-party:key", "another-secret-value")

        await waitFor(() => expect(screen.getByText(/localStorage\.setItem\(byteflow:test:key\) allowed/)).toBeInTheDocument())
        expect(screen.getByText(/sessionStorage\.setItem\(third-party:key\) review/)).toBeInTheDocument()
        expect(document.body).not.toHaveTextContent("secret-value")
        expect(document.body).not.toHaveTextContent("another-secret-value")

        fireEvent.click(screen.getByRole("button", { name: "Clear log" }))

        expect(screen.getByText("0 requests observed")).toBeInTheDocument()
        expect(screen.getByText("No storage changes observed.")).toBeInTheDocument()
    })

    it("does not render on non-tool routes", () => {
        const { container } = renderPanel("/en/trust-center")

        expect(container).toBeEmptyDOMElement()
    })

    it("defaults to a compact launcher and can collapse after opening", () => {
        renderPanel()

        expect(screen.queryByRole("complementary", { name: "Verification mode" })).not.toBeInTheDocument()

        openPanel()
        expect(screen.getByRole("complementary", { name: "Verification mode" })).toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Close" }))

        expect(screen.queryByRole("complementary", { name: "Verification mode" })).not.toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Verification mode" })).toBeInTheDocument()
    })

    it("removes runtime observers after navigating away from a tool route", async () => {
        const { rerender } = renderPanel()
        openPanel()

        fireEvent.click(screen.getByRole("button", { name: "Off" }))
        rerender(
            <LangProvider lang="en" translations={getTranslation("en")}>
                <VerificationModePanel pathname="/en/trust-center" />
            </LangProvider>,
        )

        await window.fetch("https://api.example.com/after-navigation?token=secret")

        expect(document.body).not.toHaveTextContent("api.example.com")
        expect(document.body).not.toHaveTextContent("secret")
    })
})
