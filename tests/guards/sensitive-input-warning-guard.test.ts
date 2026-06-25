import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

type GeneratedToolIndex = {
    canonicalTools: Array<{
        key: string
        slug: string
        privacy?: {
            sensitiveInput?: boolean
        }
    }>
}

const generatedToolIndex = JSON.parse(
    readFileSync("src/generated/tool-index.json", "utf8"),
) as GeneratedToolIndex

describe("sensitive input warning guard", () => {
    it("uses the shared warning on every manifest-marked sensitive input tool page", () => {
        const sensitiveTools = generatedToolIndex.canonicalTools.filter((tool) => tool.privacy?.sensitiveInput)

        expect(sensitiveTools.length).toBeGreaterThan(0)

        for (const tool of sensitiveTools) {
            const pagePath = `src/features/tools/${tool.slug}/page.tsx`
            if (!existsSync(pagePath)) continue

            const source = readFileSync(pagePath, "utf8")
            expect(source, `${tool.key} (${pagePath})`).toContain("SensitiveInputWarning")
        }
    })

    it("links warning copy to the Trust Center and DevTools verification guidance", () => {
        const source = readFileSync("src/features/tool-shell/sensitive-input-warning.tsx", "utf8")

        expect(source).toContain("sensitive_warning_title")
        expect(source).toContain("tool_trust_header.trust_center_link")
        expect(source).toContain("sensitive_warning_verify_devtools")
        expect(source).toContain('href={`/${lang}/trust-center`}')
        expect(source).toContain('href={`/${lang}/trust-center#verify-local-processing`}')
        expect(source).not.toContain('href={`/${lang}/about#privacy`}')
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
        const trustCenterSource = readFileSync("src/app/[lang]/trust-center/page.tsx", "utf8")

        expect(trustCenterSource).toContain('id="verify-local-processing"')
    })
})
