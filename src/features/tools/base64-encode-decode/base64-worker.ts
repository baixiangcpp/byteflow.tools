import { decodeBase64ToBytes, decodeBase64ToText, encodeBytesToBase64, encodeTextToBase64 } from "@/core/utils/base64-utils"
import type { Base64FileTaskInput, Base64FileTaskResult, Base64TextTaskInput, Base64TextTaskResult } from "./base64-task"

type Base64WorkerInput = Base64TextTaskInput | Base64FileTaskInput
type WorkerPostMessage = (message: unknown, transfer?: Transferable[]) => void

const postWorkerMessage = self.postMessage.bind(self) as WorkerPostMessage

function isFileTask(input: Base64WorkerInput): input is Base64FileTaskInput {
    return "task" in input && input.task === "file"
}

function runTextTask({ input, operation, urlSafe }: Base64TextTaskInput): Base64TextTaskResult {
    return {
        output: operation === "encode"
            ? encodeTextToBase64(input, urlSafe)
            : decodeBase64ToText(input.trim(), urlSafe),
    }
}

function runFileTask(input: Base64FileTaskInput): Base64FileTaskResult {
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

self.onmessage = (event: MessageEvent<Base64WorkerInput>) => {
    try {
        const result = isFileTask(event.data) ? runFileTask(event.data) : runTextTask(event.data)
        const transfer = "operation" in result && result.operation === "decode" ? [result.bytes] : undefined
        postWorkerMessage({
            ok: true,
            value: result,
        }, transfer)
    } catch (error) {
        postWorkerMessage({
            ok: false,
            error: error instanceof Error ? error.message : "BASE64_TASK_FAILED",
        })
    }
}

export {}
