import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { JwtVerifierPage } from "@/features/tools/jwt-verifier/page"
import { signHmac, encodeJsonSegment } from "@/features/tools/jwt-workbench/logic"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/jwt-verifier",
}))

vi.mock("@/core/seo/components/related-tools", () => ({
    RelatedTools: () => null,
}))

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}))

function renderJwtVerifier() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <JwtVerifierPage />
        </LangProvider>,
    )
}

async function signedToken(secret: string) {
    const header = encodeJsonSegment({ alg: "HS256", typ: "JWT" })
    const payload = encodeJsonSegment({
        sub: "alice",
        exp: Math.floor(Date.now() / 1000) + 3600,
    })
    const signingInput = `${header}.${payload}`
    return `${signingInput}.${await signHmac(signingInput, secret, "HS256")}`
}

function unsignedToken(algorithm: string) {
    return `${encodeJsonSegment({ alg: algorithm, typ: "JWT" })}.${encodeJsonSegment({ sub: "alice" })}.signature`
}

function tokenWithHeader(header: Record<string, unknown>) {
    return `${encodeJsonSegment(header)}.${encodeJsonSegment({ sub: "alice" })}.signature`
}

describe("JwtVerifierPage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("shows explicit plain-language success and failure states", async () => {
        const token = await signedToken("correct-secret")
        renderJwtVerifier()

        expect(screen.getByText("Sensitive input stays in your browser")).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Use JWT Workbench" })).toHaveAttribute("href", "/en/jwt-workbench")

        fireEvent.change(screen.getByRole("textbox", { name: "JWT Token" }), { target: { value: token } })
        fireEvent.change(screen.getByLabelText("Secret Key (for HMAC verification)"), { target: { value: "correct-secret" } })
        fireEvent.click(screen.getByRole("button", { name: "Verify" }))

        await waitFor(() => {
            expect(screen.getAllByText(/Signature matches the supplied secret \(HS256\)/).length).toBeGreaterThan(0)
            expect(screen.getAllByText(/not overall token trust/).length).toBeGreaterThan(0)
        })

        fireEvent.change(screen.getByLabelText("Secret Key (for HMAC verification)"), { target: { value: "wrong-secret" } })
        fireEvent.click(screen.getByRole("button", { name: "Verify" }))

        await waitFor(() => {
            expect(screen.getAllByText(/Signature does not match the supplied secret \(HS256\)/).length).toBeGreaterThan(0)
            expect(screen.getAllByText(/Do not trust this token for that key/).length).toBeGreaterThan(0)
        })
    })

    it("does not announce verification success before required HMAC secret input is present", async () => {
        renderJwtVerifier()

        const verifyButton = screen.getByRole("button", { name: "Verify" })
        expect(verifyButton).toBeDisabled()
        expect(verifyButton).toHaveAttribute("title", "Verify: JWT Token")

        fireEvent.change(screen.getByRole("textbox", { name: "JWT Token" }), { target: { value: unsignedToken("HS256") } })
        expect(screen.getByRole("button", { name: "Verify" })).not.toBeDisabled()

        fireEvent.click(screen.getByRole("button", { name: "Verify" }))

        await waitFor(() => {
            expect(screen.getByRole("status")).toHaveTextContent("Input is required. Secret Key (for HMAC verification)")
        })
        expect(screen.getByRole("button", { name: "Verify" })).toHaveAttribute("data-tool-action-state", "failed")
        expect(screen.queryByText(/Signature matches/)).not.toBeInTheDocument()
    })

    it("shows unsupported algorithms without reporting an invalid signature", async () => {
        renderJwtVerifier()

        fireEvent.change(screen.getByRole("textbox", { name: "JWT Token" }), { target: { value: unsignedToken("RS256") } })
        fireEvent.change(screen.getByLabelText("Secret Key (for HMAC verification)"), { target: { value: "ignored" } })
        fireEvent.click(screen.getByRole("button", { name: "Verify" }))

        await waitFor(() => {
            expect(screen.getAllByText(/Unsupported JWT algorithm \(RS256\)/).length).toBeGreaterThan(0)
            expect(screen.queryByText(/Signature does not match/)).not.toBeInTheDocument()
        })
    })

    it("shows alg none as an unsigned warning", async () => {
        renderJwtVerifier()

        fireEvent.change(screen.getByRole("textbox", { name: "JWT Token" }), { target: { value: unsignedToken("none") } })
        fireEvent.click(screen.getByRole("button", { name: "Verify" }))

        await waitFor(() => {
            expect(screen.getAllByText(/declares alg: none/).length).toBeGreaterThan(0)
            expect(screen.queryByText(/Signature does not match/)).not.toBeInTheDocument()
        })
    })

    it("shows malformed non-string alg as unsupported guidance", async () => {
        renderJwtVerifier()

        fireEvent.change(screen.getByRole("textbox", { name: "JWT Token" }), { target: { value: tokenWithHeader({ alg: 123, typ: "JWT" }) } })
        fireEvent.change(screen.getByLabelText("Secret Key (for HMAC verification)"), { target: { value: "ignored" } })
        fireEvent.click(screen.getByRole("button", { name: "Verify" }))

        await waitFor(() => {
            expect(screen.getAllByText(/Unsupported JWT algorithm \(non-string alg\)/).length).toBeGreaterThan(0)
            expect(screen.queryByText(/Signature does not match/)).not.toBeInTheDocument()
        })
    })
})
