import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

function read(path: string) {
    return readFileSync(path, "utf8")
}

describe("issue #7 Next bundled PostCSS advisory runbook", () => {
    it("keeps the stable remediation and regression checks documented", () => {
        const doc = read("docs/security/next-postcss-advisory-runbook.md")
        const ci = read(".github/workflows/ci.yml")
        const packageJson = JSON.parse(read("package.json")) as {
            dependencies: Record<string, string>
            devDependencies: Record<string, string>
            overrides: Record<string, unknown>
            scripts: Record<string, string>
        }
        const packageLock = JSON.parse(read("package-lock.json")) as {
            packages: Record<string, { version?: string }>
        }

        expect(doc).toContain("issue #7")
        expect(doc).toContain("GHSA-qx2v-qp2m-jg93")
        expect(doc).toContain("postcss >= 8.5.10")
        expect(doc).toContain("Checked on 2026-07-16")
        expect(doc).toContain("16.2.10")
        expect(doc).toContain("8.4.31")
        expect(doc).toContain("controlled npm override")
        expect(doc).toContain("0 moderate/high/critical")
        expect(doc).toContain("npm run check:audit:prod")
        expect(doc).toContain("npm run check:audit:prod-high")
        expect(doc).toContain("npm run test:e2e:pwa")
        expect(doc).toContain("Do not run `npm audit fix --force`")
        expect(packageJson.dependencies.next).toBe("16.2.10")
        expect(packageJson.devDependencies["@next/bundle-analyzer"]).toBe("16.2.10")
        expect(packageJson.devDependencies["eslint-config-next"]).toBe("16.2.10")
        expect(packageJson.overrides).toMatchObject({
            next: { postcss: "8.5.10" },
        })
        expect(packageJson.scripts["check:audit:prod"]).toBe(
            "npm audit --omit=dev --audit-level=moderate",
        )
        expect(ci).toMatch(/^\s*run: npm run check:audit:prod\s*$/m)
        expect(packageLock.packages["node_modules/next/node_modules/postcss"]?.version).toBe(
            "8.5.10",
        )
    })
})
