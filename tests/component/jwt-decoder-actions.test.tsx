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

function base64UrlJson(value: unknown) {
    const bytes = new TextEncoder().encode(JSON.stringify(value))
    let binary = ""
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function unsignedToken(payload: Record<string, unknown>) {
    return `${base64UrlJson({ alg: "HS256", typ: "JWT" })}.${base64UrlJson(payload)}.signature`
}

function localStorageValues() {
    return [...Array(window.localStorage.length)].map((_, index) => window.localStorage.getItem(window.localStorage.key(index) ?? ""))
}

describe("JwtDecoderPage actions", () => {
    beforeEach(() => {
        const store = new Map<string, string>()
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: {
                getItem: (key: string) => store.get(key) ?? null,
                setItem: (key: string, value: string) => store.set(key, value),
                removeItem: (key: string) => store.delete(key),
                key: (index: number) => [...store.keys()][index] ?? null,
                clear: () => store.clear(),
                get length() {
                    return store.size
                },
            },
        })
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
        })
    })

    it("keeps decode-only warning visible and copies claim values", async () => {
        renderJwtDecoder()

        expect(screen.getByText(/Decode only.*signature is not verified/)).toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Sample" }))

        await waitFor(() => {
            expect(screen.getByText("Claims and time semantics")).toBeInTheDocument()
        })

        fireEvent.click(screen.getByRole("button", { name: "Copy exp claim value" }))
        expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith("1516242622")

        fireEvent.click(screen.getByRole("button", { name: "Copy iat claim value" }))
        expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith("1516239022")
        expect(screen.getByText("This token is expired according to its exp claim.")).toBeInTheDocument()
    })

    it("shows actionable malformed-token errors without retaining decoded output", async () => {
        renderJwtDecoder()

        fireEvent.change(screen.getByRole("textbox", { name: "Encoded Token" }), {
            target: { value: unsignedToken({ sub: "alice" }) },
        })

        await waitFor(() => {
            expect(screen.getByText("Claims and time semantics")).toBeInTheDocument()
        })

        fireEvent.change(screen.getByRole("textbox", { name: "Encoded Token" }), {
            target: { value: "not-a-jwt" },
        })

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Token could not be decoded")
            expect(screen.getByRole("alert")).toHaveTextContent("JWT must contain exactly 3 dot-separated segments")
        })
        expect(screen.queryByText("Claims and time semantics")).not.toBeInTheDocument()
    })

    it("decodes a large payload and keeps token data out of localStorage", async () => {
        renderJwtDecoder()

        const largeClaim = "x".repeat(70_000)
        const token = unsignedToken({
            sub: "large-user",
            roles: Array.from({ length: 200 }, (_, index) => `role-${index}`),
            largeClaim,
        })

        fireEvent.change(screen.getByRole("textbox", { name: "Encoded Token" }), {
            target: { value: token },
        })

        await waitFor(() => {
            expect(screen.getByText("Claims and time semantics")).toBeInTheDocument()
        })
        expect(screen.getByText("Algorithm:")).toBeInTheDocument()
        expect(localStorageValues()).not.toContain(token)
        expect(localStorageValues()).not.toContain(largeClaim)
    })

    it("places sensitive-input warning before token input and distinguishes verifier/workbench links", () => {
        const { container } = renderJwtDecoder()

        const warning = screen.getByText("Sensitive input stays in your browser")
        const tokenInput = screen.getByRole("textbox", { name: "Encoded Token" })
        expect(warning.compareDocumentPosition(tokenInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

        expect(screen.getByRole("link", { name: /Verify signature/i })).toHaveAttribute("href", "/en/jwt-verifier")
        expect(screen.getByRole("link", { name: /Use JWT Workbench/i })).toHaveAttribute("href", "/en/jwt-workbench")
        expect(container).toHaveTextContent("Decoding shows token contents but is not proof that a token is valid, trusted, or safe to use.")
    })
})
