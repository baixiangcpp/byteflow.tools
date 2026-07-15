import { runWorkerTask, WorkerTaskError } from "@/core/workers/run-worker-task"
import { type RegexTestResult } from "./utils"

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

export type RegexTestTaskErrorCode = "worker_timeout" | "safe_evaluation_unavailable"

export type RegexTestTaskResult = RegexTestResult & {
    errorCode?: RegexTestTaskErrorCode
    workerErrorCode?: string
}

function failureResult(
    errorCode: RegexTestTaskErrorCode,
    workerErrorCode: string,
    message: string,
): RegexTestTaskResult {
    return {
        ok: false,
        error: message,
        errorCode,
        workerErrorCode,
        matches: [],
        limited: false,
        elapsedMs: 0,
        warnings: [message],
    }
}

function unavailableResult(workerErrorCode: string): RegexTestTaskResult {
    return failureResult(
        "safe_evaluation_unavailable",
        workerErrorCode,
        "Safe regex evaluation is unavailable because the isolated worker could not run. Check browser or content-security settings and try again.",
    )
}

export async function runRegexTestTask(
    pattern: string,
    flags: string,
    testString: string,
    options: RegexTestTaskOptions = {},
): Promise<RegexTestTaskResult> {
    if (typeof Worker === "undefined") {
        return unavailableResult("WORKER_UNAVAILABLE")
    }

    try {
        return await runWorkerTask<RegexTestWorkerInput, RegexTestResult>(
            () => new Worker(new URL("./regex-test-worker.ts", import.meta.url), { type: "module" }),
            { pattern, flags, testString, maxMatches: options.maxMatches },
            { signal: options.signal, timeoutMs: options.timeoutMs ?? 1_000 },
        )
    } catch (error) {
        if (error instanceof WorkerTaskError && error.code === "WORKER_TIMEOUT") {
            return failureResult(
                "worker_timeout",
                error.code,
                "Regex evaluation was stopped after the safety timeout. Simplify the pattern or test a smaller input.",
            )
        }
        if (error instanceof WorkerTaskError && error.code === "WORKER_ABORTED") {
            throw error
        }
        return unavailableResult(error instanceof WorkerTaskError ? error.code : "WORKER_UNKNOWN_ERROR")
    }
}
