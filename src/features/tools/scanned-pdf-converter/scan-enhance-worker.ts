import { applyThresholdToRgba, buildScanFilterString } from "./utils"
import type { ScanEnhanceTaskInput, ScanEnhanceTaskResult } from "./scan-enhance-task-types"

self.onmessage = (event: MessageEvent<ScanEnhanceTaskInput>) => {
    void enhanceScan(event.data)
        .then((result) => {
            self.postMessage({ ok: true, value: result })
        })
        .catch((error) => {
            self.postMessage({
                ok: false,
                error: error instanceof Error ? error.message : "SCAN_ENHANCE_TASK_FAILED",
            })
        })
}

async function enhanceScan({ source, enhance }: ScanEnhanceTaskInput): Promise<ScanEnhanceTaskResult> {
    if (typeof fetch !== "function" || typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined") {
        throw new Error("SCAN_ENHANCE_WORKER_UNSUPPORTED")
    }

    const response = await fetch(source)
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const context = canvas.getContext("2d")
    if (!context) {
        bitmap.close()
        throw new Error("SCAN_ENHANCE_CONTEXT_UNAVAILABLE")
    }

    context.filter = buildScanFilterString(enhance)
    context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height)
    context.filter = "none"

    if (enhance.thresholdEnabled) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const thresholded = applyThresholdToRgba(imageData.data, enhance.threshold)
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
