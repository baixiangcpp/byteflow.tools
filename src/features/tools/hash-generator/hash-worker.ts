import { runHashTaskSync, type HashTaskInput, type HashTaskResult } from "./hash-task-logic"

self.onmessage = (event: MessageEvent<HashTaskInput>) => {
    try {
        self.postMessage({
            ok: true,
            value: runHashTaskSync(event.data) satisfies HashTaskResult,
        })
    } catch (error) {
        self.postMessage({
            ok: false,
            error: error instanceof Error ? error.message : "HASH_TASK_FAILED",
        })
    }
}

export {}
