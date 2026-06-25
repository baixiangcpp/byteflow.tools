import { runWorkerTask, WorkerTaskError } from "@/core/workers/run-worker-task"
import { optimizeSvg } from "./logic"

export type SvgOptimizeTaskInput = {
    svg: string
}

export type SvgOptimizeTaskResult = {
    optimized: string
}

type SvgOptimizeTaskOptions = {
    signal?: AbortSignal
    timeoutMs?: number
}

export async function runSvgOptimizeTask(input: SvgOptimizeTaskInput, options: SvgOptimizeTaskOptions = {}): Promise<SvgOptimizeTaskResult> {
    if (typeof Worker === "undefined") {
        return { optimized: optimizeSvg(input.svg) }
    }

    try {
        return await runWorkerTask<SvgOptimizeTaskInput, SvgOptimizeTaskResult>(
            () => new Worker(new URL("./svg-optimize-worker.ts", import.meta.url), { type: "module" }),
            input,
            { signal: options.signal, timeoutMs: options.timeoutMs ?? 10_000 },
        )
    } catch (error) {
        if (error instanceof WorkerTaskError && (error.code === "WORKER_TIMEOUT" || error.code === "WORKER_ABORTED")) {
            throw error
        }
        return { optimized: optimizeSvg(input.svg) }
    }
}
