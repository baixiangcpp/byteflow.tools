import { runWorkerTask, WorkerTaskError } from "@/core/workers/run-worker-task"
import { testRegexPattern, type RegexTestResult } from "./utils"

type RegexTestWorkerInput = {
    pattern: string
    flags: string
    testString: string
    maxMatches?: number
}

type RegexTestTaskOptions = {
    signal?: AbortSignal
    timeoutMs?: number
    maxMatches?: number
}

function timeoutResult(message: string): RegexTestResult {
    return {
        ok: false,
        error: message,
        matches: [],
        limited: false,
        elapsedMs: 0,
        warnings: [message],
    }
}

export async function runRegexTestTask(
    pattern: string,
    flags: string,
    testString: string,
    options: RegexTestTaskOptions = {},
): Promise<RegexTestResult> {
    if (typeof Worker === "undefined") {
        return testRegexPattern(pattern, flags, testString, options.maxMatches)
    }

    try {
        return await runWorkerTask<RegexTestWorkerInput, RegexTestResult>(
            () => new Worker(new URL("./regex-test-worker.ts", import.meta.url), { type: "module" }),
            { pattern, flags, testString, maxMatches: options.maxMatches },
            { signal: options.signal, timeoutMs: options.timeoutMs ?? 1_000 },
        )
    } catch (error) {
        if (error instanceof WorkerTaskError && error.code === "WORKER_TIMEOUT") {
            return timeoutResult("Regex evaluation was stopped after the safety timeout. Simplify the pattern or test a smaller input.")
        }
        if (error instanceof WorkerTaskError && error.code === "WORKER_ABORTED") {
            throw error
        }
        return testRegexPattern(pattern, flags, testString, options.maxMatches)
    }
}
