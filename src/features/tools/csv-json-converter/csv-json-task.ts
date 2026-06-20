import { runWorkerTask } from "@/core/workers/run-worker-task"
import { runCsvJsonTaskSync, type CsvJsonTaskInput, type CsvJsonTaskResult } from "./csv-json-task-logic"

type CsvJsonTaskOptions = {
    signal?: AbortSignal
    timeoutMs?: number
}

export async function runCsvJsonTask(input: CsvJsonTaskInput, options: CsvJsonTaskOptions = {}): Promise<CsvJsonTaskResult> {
    if (typeof Worker === "undefined") {
        return runCsvJsonTaskSync(input)
    }

    try {
        return await runWorkerTask<CsvJsonTaskInput, CsvJsonTaskResult>(
            () => new Worker(new URL("./csv-json-worker.ts", import.meta.url), { type: "module" }),
            input,
            { signal: options.signal, timeoutMs: options.timeoutMs ?? 20_000 },
        )
    } catch (error) {
        if (error instanceof Error && (error.message === "WORKER_TIMEOUT" || error.message === "WORKER_ABORTED")) {
            throw error
        }
        return runCsvJsonTaskSync(input)
    }
}
