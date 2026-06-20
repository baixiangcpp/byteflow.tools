import { runWorkerTask } from "@/core/workers/run-worker-task"
import { runHashTaskSync, type HashTaskInput, type HashTaskResult } from "./hash-task-logic"

type HashTaskOptions = {
    signal?: AbortSignal
    timeoutMs?: number
}

export async function runHashTask(input: HashTaskInput, options: HashTaskOptions = {}): Promise<HashTaskResult> {
    if (typeof Worker === "undefined") {
        return runHashTaskSync(input)
    }

    try {
        return await runWorkerTask<HashTaskInput, HashTaskResult>(
            () => new Worker(new URL("./hash-worker.ts", import.meta.url), { type: "module" }),
            input,
            {
                signal: options.signal,
                timeoutMs: options.timeoutMs ?? 20_000,
                transfer: input.mode === "file" ? [input.bytes.buffer] : undefined,
            },
        )
    } catch (error) {
        if (error instanceof Error && (error.message === "WORKER_TIMEOUT" || error.message === "WORKER_ABORTED")) {
            throw error
        }
        return runHashTaskSync(input)
    }
}
