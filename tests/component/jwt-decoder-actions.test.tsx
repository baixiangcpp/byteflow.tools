import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { JwtDecoderPage } from "@/features/tools/jwt-decoder/page"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/jwt-decoder",
}))

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}))

function renderJwtDecoder() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <JwtDecoderPage />
        </LangProvider>,
    )
}

describe("JwtDecoderPage actions", () => {
    beforeEach(() => {
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
        })
    })

    it("keeps decode-only warning visible and copies claim values", async () => {
        renderJwtDecoder()

        expect(screen.getByText("Decode only — signature is not verified")).toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Try Example" }))

        await waitFor(() => {
            expect(screen.getByText("Claims and time semantics")).toBeInTheDocument()
        })

        fireEvent.click(screen.getByRole("button", { name: "Copy exp claim value" }))
        expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith("1516242622")

        fireEvent.click(screen.getByRole("button", { name: "Copy iat claim value" }))
        expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith("1516239022")
        expect(screen.getByText("This token is expired according to its exp claim.")).toBeInTheDocument()
    })
})
