import { runWorkerTask } from "@/core/workers/run-worker-task"
import type { JsonValue } from "./types"

export type JsonFormatMode = "format" | "minify"

export type JsonFormatResult = {
    output: string
    parsed: JsonValue
}

type JsonFormatWorkerInput = {
    source: string
    mode: JsonFormatMode
}

function formatJsonSync(source: string, mode: JsonFormatMode): JsonFormatResult {
    const parsed = JSON.parse(source) as JsonValue
    return {
        parsed,
        output: mode === "format" ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed),
    }
}

export async function runJsonFormatTask(source: string, mode: JsonFormatMode): Promise<JsonFormatResult> {
    if (typeof Worker === "undefined") {
        return formatJsonSync(source, mode)
    }

    try {
        return await runWorkerTask<JsonFormatWorkerInput, JsonFormatResult>(
            () => new Worker(new URL("./json-format-worker.ts", import.meta.url), { type: "module" }),
            { source, mode },
            { timeoutMs: 20_000 },
        )
    } catch (error) {
        if (error instanceof Error && error.message === "WORKER_TIMEOUT") {
            throw error
        }
        return formatJsonSync(source, mode)
    }
}
