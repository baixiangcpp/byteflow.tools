import { runWorkerTask } from "@/core/workers/run-worker-task"
import { decodeBase64ToText, encodeTextToBase64 } from "@/core/utils/base64-utils"
import type { Operation } from "./types"

export type Base64TextTaskInput = {
    input: string
    operation: Operation
    urlSafe: boolean
}

export type Base64TextTaskResult = {
    output: string
}

function runBase64TextTaskSync({ input, operation, urlSafe }: Base64TextTaskInput): Base64TextTaskResult {
    return {
        output: operation === "encode"
            ? encodeTextToBase64(input, urlSafe)
            : decodeBase64ToText(input.trim(), urlSafe),
    }
}

export async function runBase64TextTask(input: Base64TextTaskInput): Promise<Base64TextTaskResult> {
    if (typeof Worker === "undefined") {
        return runBase64TextTaskSync(input)
    }

    try {
        return await runWorkerTask<Base64TextTaskInput, Base64TextTaskResult>(
            () => new Worker(new URL("./base64-worker.ts", import.meta.url), { type: "module" }),
            input,
            { timeoutMs: 20_000 },
        )
    } catch (error) {
        if (error instanceof Error && error.message === "WORKER_TIMEOUT") {
            throw error
        }
        return runBase64TextTaskSync(input)
    }
}
