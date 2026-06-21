import type { JsonValue } from "./types"

type JsonFormatWorkerInput = {
    source: string
    mode: "format" | "minify"
}

type JsonFormatWorkerOutput = {
    output: string
    parsed: JsonValue
}

self.onmessage = (event: MessageEvent<JsonFormatWorkerInput>) => {
    const { source, mode } = event.data

    try {
        const parsed = JSON.parse(source) as JsonValue
        const output = mode === "format"
            ? JSON.stringify(parsed, null, 2)
            : JSON.stringify(parsed)

        self.postMessage({
            ok: true,
            value: { output, parsed } satisfies JsonFormatWorkerOutput,
        })
    } catch (error) {
        self.postMessage({
            ok: false,
            error: {
                code: "JSON_PARSE_FAILED",
                message: error instanceof Error ? error.message : "JSON_PARSE_FAILED",
            },
        })
    }
}

export {}
