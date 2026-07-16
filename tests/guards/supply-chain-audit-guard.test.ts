import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("supply chain audit guard", () => {
    it("keeps a production moderate-severity npm audit command wired into repo workflows", () => {
        const packageJson = JSON.parse(read("package.json")) as { scripts?: Record<string, string> }
        const workflow = read(".github/workflows/ci.yml")
        const pullRequestTemplate = read(".github/pull_request_template.md")
        const workflowLines = workflow.split(/\r?\n/).map((line) => line.trim())
        const installIndex = workflowLines.indexOf("run: npm ci")
        const auditIndex = workflowLines.indexOf("run: npm run check:audit:prod")
        const lintIndex = workflowLines.indexOf("run: npm run lint")

        expect(packageJson.scripts?.["check:audit:prod"]).toBe(
            "npm audit --omit=dev --audit-level=moderate",
        )
        expect(packageJson.scripts?.["check:audit:prod-high"]).toBe("npm audit --omit=dev --audit-level=high")
        expect(workflow).toContain("Run Production Dependency Audit")
        expect(installIndex).toBeGreaterThanOrEqual(0)
        expect(auditIndex).toBeGreaterThanOrEqual(0)
        expect(lintIndex).toBeGreaterThanOrEqual(0)
        expect(installIndex).toBeLessThan(auditIndex)
        expect(auditIndex).toBeLessThan(lintIndex)
        expect(pullRequestTemplate).toContain("`npm run check:audit:prod`")
    })
})
