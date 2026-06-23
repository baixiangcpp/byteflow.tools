import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const SENSITIVE_TOOL_FILES = [
    "src/features/tools/jwt-decoder/page.tsx",
    "src/features/tools/jwt-workbench/page.tsx",
    "src/features/tools/jwt-verifier/page.tsx",
    "src/features/tools/hash-generator/page.tsx",
    "src/features/tools/certificate-decoder/page.tsx",
    "src/features/tools/saml-decoder/page.tsx",
    "src/features/tools/http-request-builder/page.tsx",
    "src/features/tools/log-scrubber/page.tsx",
    "src/features/tools/har-viewer-sanitizer/page.tsx",
    "src/features/tools/env-parser/page.tsx",
]

describe("sensitive input warning guard", () => {
    it("uses the shared warning on sensitive token, key, certificate, log, and request tools", () => {
        for (const file of SENSITIVE_TOOL_FILES) {
            const source = readFileSync(file, "utf8")
            expect(source, file).toContain("SensitiveInputWarning")
        }
    })

    it("links warning copy to the privacy page and DevTools verification guidance", () => {
        const source = readFileSync("src/features/tool-shell/sensitive-input-warning.tsx", "utf8")

        expect(source).toContain("sensitive_warning_title")
        expect(source).toContain("sensitive_warning_verify_devtools")
        expect(source).toContain('href={`/${lang}/privacy`}')
        expect(source).toContain('href={`/${lang}/about#privacy`}')
        expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|fetch\(/)
    })

    it("masks HMAC and JWT verifier secrets by default with reveal controls", () => {
        const hashSource = readFileSync("src/features/tools/hash-generator/page.tsx", "utf8")
        const jwtVerifierSource = readFileSync("src/features/tools/jwt-verifier/page.tsx", "utf8")
        const jwtWorkbenchSource = readFileSync("src/features/tools/jwt-workbench/page.tsx", "utf8")
        const jwtSecretFieldSource = readFileSync("src/features/tools/jwt-workbench/jwt-secret-field.tsx", "utf8")

        expect(hashSource).toContain('type={secretVisible ? "text" : "password"}')
        expect(jwtVerifierSource).toContain("JwtSecretField")
        expect(jwtWorkbenchSource).toContain("JwtSecretField")
        expect(jwtSecretFieldSource).toContain('type={secretVisible ? "text" : "password"}')
        expect(hashSource).toContain("revealSecretLabel")
        expect(jwtVerifierSource).toContain("revealSecretLabel")
        expect(jwtWorkbenchSource).toContain("revealSecretLabel")
    })

    it("keeps the existing DevTools verification anchor target real", () => {
        const aboutSource = readFileSync("src/app/[lang]/about/page.tsx", "utf8")

        expect(aboutSource).toContain('id="privacy"')
    })
})
