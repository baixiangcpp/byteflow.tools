import { decodeBase64ToText, encodeTextToBase64 } from "@/core/utils/base64-utils"
import type { Base64TextTaskInput, Base64TextTaskResult } from "./base64-task"

self.onmessage = (event: MessageEvent<Base64TextTaskInput>) => {
    const { input, operation, urlSafe } = event.data

    try {
        const output = operation === "encode"
            ? encodeTextToBase64(input, urlSafe)
            : decodeBase64ToText(input.trim(), urlSafe)

        self.postMessage({
            ok: true,
            value: { output } satisfies Base64TextTaskResult,
        })
    } catch (error) {
        self.postMessage({
            ok: false,
            error: error instanceof Error ? error.message : "BASE64_TASK_FAILED",
        })
    }
}

export {}
