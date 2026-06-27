import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("issue 261 performance audit acceptance", () => {
    it("keeps major route bundle budgets including Pipeline Builder in CI", () => {
        const config = JSON.parse(read("scripts/gates/performance-budgets.json")) as {
            routes: Array<{
                route: string
                maxInitialJsGzipBytes: number
                maxInitialJsRawBytes: number
                maxInitialScriptFiles: number
                maxHtmlBytes: number
            }>
        }
        const pipelineBudget = config.routes.find((route) => route.route === "/en/pipeline-builder")

        expect(pipelineBudget).toMatchObject({
            maxInitialJsGzipBytes: 430000,
            maxInitialJsRawBytes: 1500000,
            maxInitialScriptFiles: 30,
            maxHtmlBytes: 360000,
        })
        expect(read("scripts/gates/check-performance-budget.js")).toContain('"/en/pipeline-builder"')
        expect(read("tests/guards/performance-budget-ci.test.ts")).toContain('"/en/pipeline-builder"')
    })

    it("documents release targets for bundle size, LCP, CLS, INP, and representative large inputs", () => {
        const docs = read("docs/performance/performance-budget.md")

        for (const phrase of [
            "Issue #261",
            "Pipeline Builder",
            "LCP p75: 2.5 seconds",
            "CLS p75: 0.10",
            "INP p75: 200 ms",
            "representative 256 KB+ text/SVG payloads and 4 MB image buffers",
            "without uncaught runtime errors, console errors, or failed same-origin app requests",
            "tests/unit/heavy-worker-representative-inputs.test.ts",
            "tests/guards/bf-heavy-worker-safeguards.test.ts",
            "tests/guards/tool-runtime-budget-guard.test.ts",
            "npm run test:e2e:smoke",
        ]) {
            expect(docs).toContain(phrase)
        }
    })

    it("keeps representative smoke checks watching runtime errors, console errors, and failed app requests", () => {
        const smoke = read("scripts/e2e/run-playwright-smoke.js")

        expect(smoke).toContain("function createRuntimeObserver")
        expect(smoke).toContain('page.on("console"')
        expect(smoke).toContain('message.type() === "error"')
        expect(smoke).toContain('page.on("requestfailed"')
        expect(smoke).toContain('page.on("response"')
        expect(smoke).toContain("criticalResourceTypes")
        expect(smoke).toContain('errorText !== "net::ERR_ABORTED"')
        expect(smoke).toContain("sameOrigin")
        expect(smoke).toContain("assertPipelineRecipeJourney")
        expect(smoke).toContain("assertMonacoFallbackJourney")
        expect(smoke).toContain("assertMobileToolJourney")
    })

    it("keeps heavy work behind lazy or worker boundaries", () => {
        expect(read("tests/guards/monaco-editors-defer-source-guard.test.ts")).toContain("useDesktopMonacoActivation")
        expect(read("tests/guards/bf-heavy-worker-safeguards.test.ts")).toContain("new Worker")
        expect(read("tests/unit/heavy-worker-representative-inputs.test.ts")).toContain("does not fall back to main-thread processing")
        expect(read("tests/guards/csv-json-converter-performance-guard.test.ts")).toContain("convertAbortControllerRef")
        expect(read("tests/guards/tool-runtime-budget-guard.test.ts")).toContain("TOOL_RUNTIME_BUDGETS")
    })
})
