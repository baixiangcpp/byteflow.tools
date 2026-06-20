import { runWorkerTask } from "@/core/workers/run-worker-task"
import { runCsvJsonTaskSync, type CsvJsonTaskInput, type CsvJsonTaskResult } from "./csv-json-task-logic"

export async function runCsvJsonTask(input: CsvJsonTaskInput): Promise<CsvJsonTaskResult> {
    if (typeof Worker === "undefined") {
        return runCsvJsonTaskSync(input)
    }

    try {
        return await runWorkerTask<CsvJsonTaskInput, CsvJsonTaskResult>(
            () => new Worker(new URL("./csv-json-worker.ts", import.meta.url), { type: "module" }),
            input,
            { timeoutMs: 20_000 },
        )
    } catch (error) {
        if (error instanceof Error && error.message === "WORKER_TIMEOUT") {
            throw error
        }
        return runCsvJsonTaskSync(input)
    }
}
