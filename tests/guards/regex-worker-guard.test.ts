import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

function read(path: string) {
    return readFileSync(path, "utf8")
}

describe("regex worker guard", () => {
    it("keeps regex evaluation routed through a worker task with timeout and cancellation", () => {
        const page = read("src/features/tools/regex-tester/page.tsx")
        const task = read("src/features/tools/regex-tester/regex-test-task.ts")
        const worker = read("src/features/tools/regex-tester/regex-test-worker.ts")
        const pipelineAdapters = read("src/features/pipeline/adapter-registry.ts")

        expect(page).toContain("evaluationAbortControllerRef")
        expect(page).toContain("runRegexTestTask")
        expect(page).not.toContain("testRegexPattern(")
        expect(task).toContain("new Worker(new URL(\"./regex-test-worker.ts\", import.meta.url)")
        expect(task).toContain("timeoutMs ?? 1_000")
        expect(task).toContain("WORKER_TIMEOUT")
        expect(task).toContain("safe_evaluation_unavailable")
        expect(task).not.toContain("testRegexPattern")
        expect(worker).toContain("testRegexPattern(pattern, flags, testString, maxMatches)")
        expect(pipelineAdapters).toContain("runRegexTestTask(pattern, flags, input")
        expect(pipelineAdapters).not.toContain("testRegexPattern")
    })
})
