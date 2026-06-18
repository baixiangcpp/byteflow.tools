import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("supply chain audit guard", () => {
    it("keeps a production high-severity npm audit command wired into repo workflows", () => {
        const packageJson = JSON.parse(read("package.json")) as { scripts?: Record<string, string> }
        const workflow = read(".github/workflows/ci.yml")
        const pullRequestTemplate = read(".github/pull_request_template.md")

        expect(packageJson.scripts?.["check:audit:prod-high"]).toBe("npm audit --omit=dev --audit-level=high")
        expect(workflow).toContain("Run Production Dependency Audit")
        expect(workflow).toContain("npm run check:audit:prod-high")
        expect(workflow.indexOf("npm ci")).toBeLessThan(workflow.indexOf("npm run check:audit:prod-high"))
        expect(workflow.indexOf("npm run check:audit:prod-high")).toBeLessThan(workflow.indexOf("npm run lint"))
        expect(pullRequestTemplate).toContain("`npm run check:audit:prod-high`")
    })
})
