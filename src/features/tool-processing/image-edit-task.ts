import { runWorkerTask } from "@/core/workers/run-worker-task"
import { runImageEditDomTask } from "./image-edit-dom"
import type { ImageEditTaskInput, ImageEditTaskResult } from "./image-edit-worker-types"

type ImageEditTaskOptions = {
    signal?: AbortSignal
    timeoutMs?: number
}

export async function runImageEditTask(input: ImageEditTaskInput, options: ImageEditTaskOptions = {}): Promise<ImageEditTaskResult> {
    if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined" || typeof createImageBitmap !== "function") {
        return runImageEditDomTask(input)
    }

    try {
        return await runWorkerTask<ImageEditTaskInput, ImageEditTaskResult>(
            () => new Worker(new URL("./image-edit-worker.ts", import.meta.url), { type: "module" }),
            input,
            { signal: options.signal, timeoutMs: options.timeoutMs ?? 20_000 },
        )
    } catch (error) {
        if (error instanceof Error && (error.message === "WORKER_TIMEOUT" || error.message === "WORKER_ABORTED")) {
            throw error
        }
        return runImageEditDomTask(input)
    }
}
