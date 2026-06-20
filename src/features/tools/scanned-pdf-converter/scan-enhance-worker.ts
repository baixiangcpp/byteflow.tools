import { applyThresholdToRgba, buildScanFilterString } from "./utils"
import type { ScanEnhanceTaskInput, ScanEnhanceTaskResult } from "./scan-enhance-task-types"

type WorkerPostMessage = (message: unknown, transfer?: Transferable[]) => void

const postWorkerMessage = self.postMessage.bind(self) as WorkerPostMessage

self.onmessage = (event: MessageEvent<ScanEnhanceTaskInput>) => {
    void enhanceScan(event.data)
        .then((result) => {
            postWorkerMessage({ ok: true, value: result }, [result.bytes])
        })
        .catch((error) => {
            postWorkerMessage({
                ok: false,
                error: error instanceof Error ? error.message : "SCAN_ENHANCE_TASK_FAILED",
            })
        })
}

function dataUrlToBlob(dataUrl: string): Blob {
    const match = dataUrl.match(/^data:([^;,]+);base64,([\s\S]+)$/i)
    if (!match) {
        throw new Error("SCAN_ENHANCE_WORKER_UNSUPPORTED")
    }

    const binary = atob(match[2])
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }
    return new Blob([bytes], { type: match[1] })
}

function inputToBlob(input: ScanEnhanceTaskInput): Blob {
    if (input.sourceBytes) {
        return new Blob([input.sourceBytes], { type: input.sourceMime || "application/octet-stream" })
    }
    return dataUrlToBlob(input.source)
}

async function enhanceScan(input: ScanEnhanceTaskInput): Promise<ScanEnhanceTaskResult> {
    if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined") {
        throw new Error("SCAN_ENHANCE_WORKER_UNSUPPORTED")
    }

    const bitmap = await createImageBitmap(inputToBlob(input))
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const context = canvas.getContext("2d")
    if (!context) {
        bitmap.close()
        throw new Error("SCAN_ENHANCE_CONTEXT_UNAVAILABLE")
    }

    context.filter = buildScanFilterString(input.enhance)
    context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height)
    context.filter = "none"

    if (input.enhance.thresholdEnabled) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const thresholded = applyThresholdToRgba(imageData.data, input.enhance.threshold)
        imageData.data.set(thresholded)
        context.putImageData(imageData, 0, 0)
    }

    const outputBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 })
    const bytes = await outputBlob.arrayBuffer()
    const result: ScanEnhanceTaskResult = {
        mime: "image/jpeg",
        bytes,
        width: bitmap.width,
        height: bitmap.height,
    }
    bitmap.close()
    return result
}

export {}
