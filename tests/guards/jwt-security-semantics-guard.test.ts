import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("JWT security semantics guard", () => {
    it("keeps decoder copy explicit that decode is not verification", () => {
        const pageSource = read("src/features/tools/jwt-decoder/page.tsx")
        const utilsSource = read("src/features/tools/jwt-decoder/utils.ts")
        const en = read("src/core/i18n/translations/en.json")

        expect(pageSource).toContain("decode_only_title")
        expect(pageSource).toContain("verifier_cta")
        expect(pageSource).toContain("claims_summary_title")
        expect(pageSource).toContain("alg_none_warning")
        expect(pageSource).toContain("expired_warning")
        expect(en).toContain("Decode only")
        expect(en).toContain("signature is not verified")
        expect(en).toContain("Verify signature")

        expect(utilsSource).toContain("alg_none")
        expect(utilsSource).toContain("expired")
        expect(utilsSource).toContain("not_yet_valid")
        expect(utilsSource).toContain("issued_in_future")
    })

    it("keeps JWT tokens and secrets out of persistence, analytics, and console output", () => {
        const files = [
            "src/features/tools/jwt-decoder/page.tsx",
            "src/features/tools/jwt-decoder/utils.ts",
            "src/features/tools/jwt-verifier/page.tsx",
            "src/features/tools/jwt-verifier/logic.ts",
            "src/features/tools/jwt-workbench/page.tsx",
            "src/features/tools/jwt-workbench/logic.ts",
        ]

        const offenders = files.flatMap((file) => {
            const source = read(file)
            const findings: string[] = []
            if (/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/.test(source)) findings.push(`${file}: storage`)
            if (/\btrackEvent\b|\btrackToolUsage\b|\banalytics\b/.test(source)) findings.push(`${file}: analytics`)
            if (/\bconsole\.(log|debug|info|warn|error)\s*\(/.test(source)) findings.push(`${file}: console`)
            if (/\bbuildToolHandoffLink\b|\bbuildShareableToolHandoffHref\b/.test(source)) findings.push(`${file}: payload handoff`)
            return findings
        })

        expect(offenders).toEqual([])
    })

    it("keeps HMAC secrets masked in verifier and workbench inputs", () => {
        const verifier = read("src/features/tools/jwt-verifier/page.tsx")
        const workbench = read("src/features/tools/jwt-workbench/page.tsx")
        const secretField = read("src/features/tools/jwt-workbench/jwt-secret-field.tsx")

        expect(verifier).toContain("JwtSecretField")
        expect(workbench).toContain("JwtSecretField")
        expect(secretField).toContain('type={secretVisible ? "text" : "password"}')
        expect(secretField).toContain('autoComplete="off"')
        expect(secretField).toContain("aria-pressed={secretVisible}")
    })
})
