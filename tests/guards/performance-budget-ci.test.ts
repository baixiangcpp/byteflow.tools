import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const REQUIRED_ROUTES = ["/", "/en", "/en/all-tools", "/en/json-formatter", "/en/markdown-preview", "/en/image-resizer"]

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("performance budget CI guard", () => {
    it("defines explicit route budgets for the BF-025 baseline pages", () => {
        const config = JSON.parse(read("scripts/gates/performance-budgets.json")) as {
            routes: Array<Record<string, number | string>>
        }
        const routes = new Set(config.routes.map((route) => route.route))

        for (const route of REQUIRED_ROUTES) {
            expect(routes.has(route)).toBe(true)
        }

        for (const budget of config.routes) {
            expect(budget.maxInitialJsGzipBytes).toBeGreaterThan(0)
            expect(budget.maxInitialJsGzipBytes).toBeLessThanOrEqual(500000)
            expect(budget.maxInitialScriptFiles).toBeGreaterThan(0)
            expect(budget.maxInitialScriptFiles).toBeLessThanOrEqual(35)
            expect(budget.maxHtmlBytes).toBeGreaterThan(0)
        }
    })

    it("wires config checks into validate and route reports into build post checks", () => {
        const packageJson = JSON.parse(read("package.json")) as { scripts: Record<string, string> }

        expect(packageJson.scripts["check:performance-budget"]).toBe(
            "node scripts/gates/check-performance-budget.js --check-config",
        )
        expect(packageJson.scripts["check:performance-budget:report"]).toBe(
            "node scripts/gates/check-performance-budget.js --report",
        )
        expect(packageJson.scripts.validate).toContain("npm run check:performance-budget")
        expect(packageJson.scripts["build:post"]).toContain("npm run check:performance-budget:report")
    })

    it("documents budget update policy and CI output", () => {
        const docs = read("docs/performance/performance-budget.md")

        expect(docs).toContain("npm run check:performance-budget:report")
        expect(docs).toContain("before and after values")
        expect(docs).toContain("Do not raise budgets to hide accidental regressions")
    })
})
