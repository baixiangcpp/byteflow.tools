import { runCsvJsonTaskSync, type CsvJsonTaskInput, type CsvJsonTaskResult } from "./csv-json-task-logic"

self.onmessage = (event: MessageEvent<CsvJsonTaskInput>) => {
    try {
        self.postMessage({
            ok: true,
            value: runCsvJsonTaskSync(event.data) satisfies CsvJsonTaskResult,
        })
    } catch (error) {
        self.postMessage({
            ok: false,
            error: error instanceof Error ? error.message : "CSV_JSON_TASK_FAILED",
        })
    }
}

export {}
