import { runWorkerTask } from "@/core/workers/run-worker-task"
import { decodeBase64ToBytes, decodeBase64ToText, encodeBytesToBase64, encodeTextToBase64 } from "@/core/utils/base64-utils"
import type { Operation } from "./types"

export type Base64TextTaskInput = {
    input: string
    operation: Operation
    urlSafe: boolean
}

export type Base64TextTaskResult = {
    output: string
}

export type Base64FileTaskInput =
    | {
        task: "file"
        operation: "encode"
        bytes: ArrayBuffer
        urlSafe: boolean
    }
    | {
        task: "file"
        operation: "decode"
        input: string
        urlSafe: boolean
    }

export type Base64FileTaskResult =
    | {
        operation: "encode"
        output: string
    }
    | {
        operation: "decode"
        bytes: ArrayBuffer
    }

type Base64TextTaskOptions = {
    signal?: AbortSignal
    timeoutMs?: number
}

type Base64FileTaskOptions = Base64TextTaskOptions

function runBase64TextTaskSync({ input, operation, urlSafe }: Base64TextTaskInput): Base64TextTaskResult {
    return {
        output: operation === "encode"
            ? encodeTextToBase64(input, urlSafe)
            : decodeBase64ToText(input.trim(), urlSafe),
    }
}

function runBase64FileTaskSync(input: Base64FileTaskInput): Base64FileTaskResult {
    if (input.operation === "encode") {
        return {
            operation: "encode",
            output: encodeBytesToBase64(new Uint8Array(input.bytes), input.urlSafe),
        }
    }

    const decoded = decodeBase64ToBytes(input.input.trim(), input.urlSafe)
    const bytes = Uint8Array.from(decoded)
    return {
        operation: "decode",
        bytes: bytes.buffer as ArrayBuffer,
    }
}

export async function runBase64TextTask(input: Base64TextTaskInput, options: Base64TextTaskOptions = {}): Promise<Base64TextTaskResult> {
    if (typeof Worker === "undefined") {
        return runBase64TextTaskSync(input)
    }

    try {
        return await runWorkerTask<Base64TextTaskInput, Base64TextTaskResult>(
            () => new Worker(new URL("./base64-worker.ts", import.meta.url), { type: "module" }),
            input,
            { signal: options.signal, timeoutMs: options.timeoutMs ?? 20_000 },
        )
    } catch (error) {
        if (error instanceof Error && (error.message === "WORKER_TIMEOUT" || error.message === "WORKER_ABORTED")) {
            throw error
        }
        return runBase64TextTaskSync(input)
    }
}

export async function runBase64FileTask(input: Base64FileTaskInput, options: Base64FileTaskOptions = {}): Promise<Base64FileTaskResult> {
    if (typeof Worker === "undefined") {
        return runBase64FileTaskSync(input)
    }

    try {
        return await runWorkerTask<Base64FileTaskInput, Base64FileTaskResult>(
            () => new Worker(new URL("./base64-worker.ts", import.meta.url), { type: "module" }),
            input,
            {
                signal: options.signal,
                timeoutMs: options.timeoutMs ?? 20_000,
                transfer: input.operation === "encode" ? [input.bytes] : undefined,
            },
        )
    } catch (error) {
        if (error instanceof Error && (error.message === "WORKER_TIMEOUT" || error.message === "WORKER_ABORTED")) {
            throw error
        }
        if (input.operation === "encode" && error instanceof Error && error.message !== "WORKER_CREATE_FAILED" && error.message !== "WORKER_POST_MESSAGE_FAILED") {
            throw error
        }
        return runBase64FileTaskSync(input)
    }
}
