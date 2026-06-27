import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const PROJECT_ROOT = process.cwd()

function readSource(relativePath: string) {
    return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8")
}

describe("verification mode acceptance guard", () => {
    it("records only request hosts and storage keys, never sensitive payload fields", () => {
        const panelSource = readSource("src/components/layout/verification-mode-panel.tsx")
        const trustSource = readSource("src/core/trust/verification-mode.ts")

        expect(panelSource).toContain("recordNetwork(input, getVerificationRequestMethod(input, init))")
        expect(panelSource).toContain('recordNetwork(url, "BEACON")')
        expect(panelSource).toContain("recordStorage(this, \"setItem\", key)")
        expect(panelSource).not.toContain("raw-secret-body")
        expect(panelSource).not.toContain("Authorization")
        expect(panelSource).not.toContain("headers:")
        expect(panelSource).not.toContain("body:")
        expect(trustSource).toContain("host: url.origin")
        expect(trustSource).not.toContain("url.search")
        expect(trustSource).not.toContain("url.href")
        expect(trustSource).not.toContain("url.pathname")
    })

    it("keeps the panel scoped to tool routes and links users to verification documentation", () => {
        const panelSource = readSource("src/components/layout/verification-mode-panel.tsx")
        const runtimeSource = readSource("src/components/layout/app-runtime.tsx")
        const trustCenterSource = readSource("src/app/[lang]/trust-center/page.tsx")

        expect(runtimeSource).toContain("<VerificationModePanel pathname={pathname} />")
        expect(panelSource).toContain("getRouteToolBySlug(slug)")
        expect(panelSource).toContain("if (!enabled || !tool")
        expect(panelSource).toContain("#verify-local-processing")
        expect(trustCenterSource).toContain("trust_center_verification_mode_desc")
    })
})
