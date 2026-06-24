import { runWorkerTask } from "@/core/workers/run-worker-task"
import { runCompressionLab, type BinaryEncoding, type CompressionFormatName, type CompressionMode, type CompressionResult } from "./utils"

export type CompressionTaskInput = {
    input: string
    mode: CompressionMode
    format: CompressionFormatName
    inputEncoding: BinaryEncoding
    outputEncoding: BinaryEncoding
}

type CompressionTaskOptions = {
    signal?: AbortSignal
    timeoutMs?: number
}

export async function runCompressionTask(task: CompressionTaskInput, options: CompressionTaskOptions = {}): Promise<CompressionResult> {
    if (typeof Worker === "undefined") {
        return runCompressionLab(task.input, task)
    }

    try {
        return await runWorkerTask<CompressionTaskInput, CompressionResult>(
            () => new Worker(new URL("./compression-worker.ts", import.meta.url), { type: "module" }),
            task,
            { signal: options.signal, timeoutMs: options.timeoutMs ?? 15_000 },
        )
    } catch (error) {
        if (error instanceof Error && (error.message === "WORKER_TIMEOUT" || error.message === "WORKER_ABORTED")) {
            throw error
        }
        return runCompressionLab(task.input, task)
    }
}
