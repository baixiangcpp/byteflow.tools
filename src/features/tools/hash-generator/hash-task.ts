import { runWorkerTask } from "@/core/workers/run-worker-task"
import { runHashTaskSync, type HashTaskInput, type HashTaskResult } from "./hash-task-logic"

export async function runHashTask(input: HashTaskInput): Promise<HashTaskResult> {
    if (typeof Worker === "undefined") {
        return runHashTaskSync(input)
    }

    try {
        return await runWorkerTask<HashTaskInput, HashTaskResult>(
            () => new Worker(new URL("./hash-worker.ts", import.meta.url), { type: "module" }),
            input,
            { timeoutMs: 20_000 },
        )
    } catch (error) {
        if (error instanceof Error && error.message === "WORKER_TIMEOUT") {
            throw error
        }
        return runHashTaskSync(input)
    }
}
