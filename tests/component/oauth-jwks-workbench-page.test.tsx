import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { OauthJwksWorkbenchPage } from "@/features/tools/oauth-jwks-workbench/page"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/oauth-jwks-workbench",
}))

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}))

function renderOauthJwksWorkbench() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <OauthJwksWorkbenchPage />
        </LangProvider>,
    )
}

describe("OauthJwksWorkbenchPage", () => {
    it("shows only the PKCE workflow by default and toggles JWKS inputs by mode", async () => {
        const originalCrypto = globalThis.crypto
        const subtleDigest = vi.fn().mockResolvedValue(new Uint8Array(32).buffer)

        try {
            Object.defineProperty(globalThis, "crypto", {
                configurable: true,
                value: {
                    getRandomValues: vi.fn((array: Uint8Array) => {
                        array.fill(1)
                        return array
                    }),
                    subtle: {
                        digest: subtleDigest,
                    },
                },
            })

            renderOauthJwksWorkbench()

            expect(screen.getByRole("button", { name: "PKCE helper" })).toBeInTheDocument()
            expect(screen.getByRole("button", { name: "Generate PKCE" })).toBeInTheDocument()
            expect(screen.queryByRole("button", { name: "Sample" })).not.toBeInTheDocument()
            expect(screen.queryByRole("textbox", { name: "JWKS JSON" })).not.toBeInTheDocument()
            expect(screen.queryByRole("textbox", { name: "JWT to verify" })).not.toBeInTheDocument()
            expect(screen.queryByRole("combobox", { name: "JWKS key to verify with" })).not.toBeInTheDocument()

            fireEvent.click(screen.getByRole("button", { name: "Generate PKCE" }))

            await waitFor(() => {
                expect(screen.getByRole("textbox", { name: "Output" })).toHaveDisplayValue(/"verifier"/)
                expect(screen.getByRole("textbox", { name: "Output" })).toHaveDisplayValue(/"challenge"/)
            })

            fireEvent.click(screen.getByRole("button", { name: "JWKS inspector" }))

            expect(screen.getByRole("textbox", { name: "Output" })).toHaveDisplayValue("")
            expect(screen.getByRole("button", { name: "Inspect JWKS" })).toBeInTheDocument()
            expect(screen.getByRole("button", { name: "Sample" })).toBeInTheDocument()
            expect(screen.getByRole("textbox", { name: "JWKS JSON" })).toBeInTheDocument()
            expect(screen.getByRole("textbox", { name: "JWT to verify" })).toBeInTheDocument()
            expect(screen.getByRole("combobox", { name: "JWKS key to verify with" })).toBeInTheDocument()

            fireEvent.click(screen.getByRole("button", { name: "Inspect JWKS" }))

            await waitFor(() => {
                expect(screen.getByRole("textbox", { name: "Output" })).toHaveDisplayValue(/"keys"/)
            })

            fireEvent.click(screen.getByRole("button", { name: "PKCE helper" }))

            expect(screen.getByRole("textbox", { name: "Output" })).toHaveDisplayValue("")
            expect(screen.getByRole("button", { name: "Generate PKCE" })).toBeInTheDocument()
            expect(screen.queryByRole("button", { name: "Sample" })).not.toBeInTheDocument()
            expect(screen.queryByRole("textbox", { name: "JWKS JSON" })).not.toBeInTheDocument()
            expect(screen.queryByRole("textbox", { name: "JWT to verify" })).not.toBeInTheDocument()
            expect(screen.queryByRole("combobox", { name: "JWKS key to verify with" })).not.toBeInTheDocument()
        } finally {
            Object.defineProperty(globalThis, "crypto", {
                configurable: true,
                value: originalCrypto,
            })
        }
    })
})
