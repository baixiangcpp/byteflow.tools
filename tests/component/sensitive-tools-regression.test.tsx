import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LogScrubberPage } from "@/features/tools/log-scrubber/page"
import { HarViewerSanitizerPage } from "@/features/tools/har-viewer-sanitizer/page"
import { CertificateDecoderPage } from "@/features/tools/certificate-decoder/page"
import { CspParserPage } from "@/features/tools/csp-parser/page"
import { SecurityHeaderAnalyzerPage } from "@/features/tools/security-header-analyzer/page"
import { EnvVariableParserPage } from "@/features/tools/env-parser/page"
import { LocalLogParserPage } from "@/features/tools/local-log-parser/page"

const clipboardWriteMock = vi.fn()
const toastMocks = vi.hoisted(() => ({
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
}))

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/log-scrubber",
}))

vi.mock("@/core/clipboard/clipboard", () => ({
    safeClipboardWrite: (value: string) => clipboardWriteMock(value),
}))

vi.mock("sonner", () => ({
    toast: toastMocks,
}))

vi.mock("@/core/seo/components/related-tools", () => ({
    RelatedTools: ({ toolKey }: { toolKey: string }) => <div data-testid="related-tools">{toolKey}</div>,
}))

function renderEnglish(ui: React.ReactNode) {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            {ui}
        </LangProvider>,
    )
}

function expectSensitiveWarningLinks() {
    expect(screen.getByLabelText("Sensitive input warning")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Trust Center/i })).toHaveAttribute("href", "/en/trust-center")
    expect(screen.getByRole("link", { name: /DevTools/i })).toHaveAttribute("href", "/en/trust-center#verify-local-processing")
}

function expectNoPayloadStorage(payload: string) {
    for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index)
        const value = key ? window.localStorage.getItem(key) : null
        expect(`${key ?? ""}:${value ?? ""}`).not.toContain(payload)
    }
}

function derLength(length: number) {
    if (length < 0x80) return [length]
    const bytes: number[] = []
    let remaining = length
    while (remaining > 0) {
        bytes.unshift(remaining & 0xff)
        remaining >>= 8
    }
    return [0x80 | bytes.length, ...bytes]
}

function der(tag: number, value: number[]) {
    return [tag, ...derLength(value.length), ...value]
}

function sequence(...children: number[][]) {
    return der(0x30, children.flat())
}

function setOf(...children: number[][]) {
    return der(0x31, children.flat())
}

function oid(value: string) {
    const parts = value.split(".").map(Number)
    const body = [parts[0] * 40 + parts[1]]
    for (const part of parts.slice(2)) {
        const encoded = [part & 0x7f]
        let remaining = part >> 7
        while (remaining > 0) {
            encoded.unshift((remaining & 0x7f) | 0x80)
            remaining >>= 7
        }
        body.push(...encoded)
    }
    return der(0x06, body)
}

function utf8(value: string) {
    return Array.from(new TextEncoder().encode(value))
}

function distinguishedName(commonName: string) {
    return sequence(setOf(sequence(oid("2.5.4.3"), der(0x0c, utf8(commonName)))))
}

function minimalCertificatePem() {
    const algorithm = sequence(oid("1.2.840.113549.1.1.11"), der(0x05, []))
    const name = distinguishedName("Byteflow Test")
    const validity = sequence(der(0x17, utf8("260101000000Z")), der(0x17, utf8("300101000000Z")))
    const publicKey = sequence(sequence(oid("1.2.840.113549.1.1.1"), der(0x05, [])), der(0x03, [0x00, 0x30, 0x00]))
    const tbsCertificate = sequence(der(0x02, [0x01]), algorithm, name, validity, name, publicKey)
    const certBytes = new Uint8Array(sequence(tbsCertificate, algorithm, der(0x03, [0x00, 0x00])))
    const base64 = Buffer.from(certBytes).toString("base64").replace(/.{1,64}/g, "$&\n").trim()
    return `-----BEGIN CERTIFICATE-----\n${base64}\n-----END CERTIFICATE-----`
}

describe("sensitive tool regression coverage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        clipboardWriteMock.mockResolvedValue({ ok: true })
        window.localStorage.clear()
    })

    it("redacts Log Scrubber sample data and does not persist payloads", () => {
        renderEnglish(<LogScrubberPage />)

        expectSensitiveWarningLinks()
        fireEvent.click(screen.getByRole("button", { name: "Sample" }))
        fireEvent.click(screen.getByRole("button", { name: "Scrub logs" }))

        const output = screen.getByPlaceholderText("Redacted logs will appear here...") as HTMLTextAreaElement
        expect(output.value).toContain("[EMAIL_REDACTED]")
        expect(output.value).toContain("[IP_REDACTED]")
        expect(output.value).toContain("[TOKEN_REDACTED]")
        expect(output.value).not.toContain("alice@example.com")
        expect(output.value).not.toContain("hunter2")
        expect(screen.getByText(/Automated redaction is a safety layer/)).toBeInTheDocument()
        expectNoPayloadStorage("alice@example.com")
    })

    it("sanitizes HAR exports, handles malformed input, and avoids storage writes", () => {
        renderEnglish(<HarViewerSanitizerPage />)

        expectSensitiveWarningLinks()
        fireEvent.change(screen.getByPlaceholderText("Paste a HAR JSON export..."), {
            target: { value: "{not-json" },
        })
        fireEvent.click(screen.getByRole("button", { name: "Sanitize" }))
        expect(screen.getByRole("alert")).toHaveTextContent(/Expected property name|Unexpected token|valid JSON|Unable to sanitize HAR/i)

        fireEvent.click(screen.getByRole("button", { name: /Try example/i }))
        fireEvent.click(screen.getByRole("button", { name: "Sanitize" }))

        const output = screen.getByPlaceholderText("Sanitized HAR JSON will appear here...") as HTMLTextAreaElement
        expect(output.value).toContain("[REDACTED]")
        expect(output.value).toContain("_byteflowSanitizerSummary")
        expect(output.value).not.toContain("Bearer secret")
        expect(output.value).not.toContain("cookie-secret")
        expectNoPayloadStorage("Bearer secret")
    })

    it("decodes normal certificates and covers empty, malformed, and large invalid PEM input without storage", () => {
        renderEnglish(<CertificateDecoderPage />)

        expectSensitiveWarningLinks()
        const pemInput = screen.getByPlaceholderText(/-----BEGIN CERTIFICATE-----/)
        const validPem = minimalCertificatePem()

        fireEvent.click(screen.getByRole("button", { name: "Decode" }))
        expect(screen.queryByText(/Failed to parse certificate/i)).not.toBeInTheDocument()

        fireEvent.change(pemInput, { target: { value: validPem } })
        fireEvent.click(screen.getByRole("button", { name: "Decode" }))
        expect(screen.getAllByText("CN=Byteflow Test").length).toBeGreaterThanOrEqual(2)
        expect(screen.getByText("SHA256withRSA")).toBeInTheDocument()
        expectNoPayloadStorage(validPem.slice(28, 52))

        fireEvent.change(pemInput, {
            target: { value: "not a certificate" },
        })
        fireEvent.click(screen.getByRole("button", { name: "Decode" }))
        expect(screen.getByText("Failed to parse certificate. Ensure it's a valid PEM-encoded X.509 certificate.")).toBeInTheDocument()
        expectNoPayloadStorage("not a certificate")

        const largeInvalidPem = `-----BEGIN CERTIFICATE-----\n${"A".repeat(12_000)}\n-----END CERTIFICATE-----`
        fireEvent.change(pemInput, { target: { value: largeInvalidPem } })
        fireEvent.click(screen.getByRole("button", { name: "Decode" }))
        expect(screen.getByText("Failed to parse certificate. Ensure it's a valid PEM-encoded X.509 certificate.")).toBeInTheDocument()
        expectNoPayloadStorage("AAAA")
    })

    it("keeps CSP analysis visible for normal, malformed, empty, and large risky policies without persistence", async () => {
        renderEnglish(<CspParserPage />)

        expectSensitiveWarningLinks()
        const cspInput = screen.getByPlaceholderText(/default-src/)

        expect(await screen.findByText("default-src")).toBeInTheDocument()
        expect(screen.getByText("frame-ancestors")).toBeInTheDocument()

        fireEvent.change(cspInput, {
            target: { value: "not-a-directive @@@; script-src 'unsafe-inline' *" },
        })
        expect(await screen.findByText(/Unknown directive/)).toBeInTheDocument()
        expect(screen.getAllByText(/unsafe-inline/).length).toBeGreaterThan(0)

        const largePolicy = [
            ...Array.from({ length: 180 }, (_, index) => `img-src https://cdn-${index}.example.com`),
            "script-src 'unsafe-inline' *",
        ].join("; ")
        fireEvent.change(cspInput, {
            target: { value: largePolicy },
        })
        expect(await screen.findByText("https://cdn-179.example.com")).toBeInTheDocument()
        expect(screen.getAllByText(/unsafe-inline/).length).toBeGreaterThan(0)
        expect(screen.getByText("Missing Recommended Directives")).toBeInTheDocument()

        fireEvent.change(cspInput, {
            target: { value: "script-src 'unsafe-inline' *" },
        })
        expect(await screen.findByText("Missing Recommended Directives")).toBeInTheDocument()
        expect(screen.getAllByText(/unsafe-inline/).length).toBeGreaterThan(0)

        fireEvent.click(screen.getByRole("button", { name: /Clear/i }))
        expect(screen.queryByText("Missing Recommended Directives")).not.toBeInTheDocument()
        expectNoPayloadStorage("unsafe-inline")
    })

    it("copies Security Header Analyzer reports for empty and normal inputs without storage writes", async () => {
        renderEnglish(<SecurityHeaderAnalyzerPage />)

        expectSensitiveWarningLinks()
        expect(screen.getByText(/Security Header Score/i)).toBeInTheDocument()
        fireEvent.click(screen.getByRole("button", { name: "Copy" }))

        await waitFor(() => expect(clipboardWriteMock).toHaveBeenCalledWith(expect.stringContaining("Security Header Score")))
        expect(clipboardWriteMock).toHaveBeenCalledWith(expect.stringContaining("Content-Security-Policy"))

        fireEvent.change(screen.getByPlaceholderText(/HTTP\/2 200/), { target: { value: "" } })
        expect(screen.getByText(/Missing Content-Security-Policy header/)).toBeInTheDocument()
        expectNoPayloadStorage("content-security-policy")
    })

    it("exports Env Parser output without writing secret payloads to localStorage", async () => {
        renderEnglish(<EnvVariableParserPage />)

        expectSensitiveWarningLinks()
        fireEvent.change(screen.getByPlaceholderText("Paste .env content here..."), {
            target: { value: "API_KEY=super-secret-value" },
        })
        fireEvent.click(screen.getByRole("button", { name: "Copy" }))

        await waitFor(() => expect(clipboardWriteMock).toHaveBeenCalledWith(expect.stringContaining("super-secret-value")))
        expectNoPayloadStorage("super-secret-value")
    })

    it("parses and exports Local Log Parser output without default storage", () => {
        const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:logs")
        const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)
        const clickMock = vi.fn()
        const createElementSpy = vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
            const element = document.createElementNS("http://www.w3.org/1999/xhtml", tagName) as HTMLElement
            if (tagName.toLowerCase() === "a") {
                Object.assign(element, { click: clickMock })
            }
            return element
        })

        renderEnglish(<LocalLogParserPage />)

        expectSensitiveWarningLinks()
        fireEvent.click(screen.getByRole("button", { name: "Parse Logs" }))
        expect(toastMocks.error).toHaveBeenCalledWith("Input is required.")
        expect(screen.queryByRole("button", { name: "Export JSON" })).not.toBeInTheDocument()

        fireEvent.change(screen.getByPlaceholderText(/Paste logs here/), {
            target: { value: "2026-06-10T10:00:00Z ERROR token=[REDACTED]" },
        })
        fireEvent.click(screen.getByRole("button", { name: "Parse Logs" }))
        expect(screen.getByText("Errors")).toBeInTheDocument()
        fireEvent.click(screen.getByRole("button", { name: "Export JSON" }))

        expect(createObjectURL).toHaveBeenCalled()
        expect(clickMock).toHaveBeenCalled()
        expectNoPayloadStorage("token=[REDACTED]")

        createElementSpy.mockRestore()
        createObjectURL.mockRestore()
        revokeObjectURL.mockRestore()
    })
})
