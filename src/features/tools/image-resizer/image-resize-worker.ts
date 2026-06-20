import { calculateResizeDrawBox, getOutputMimeType, normalizeResizeDimension } from "./utils"
import type { ImageResizeTaskInput, ImageResizeTaskResult } from "./image-resize-task-types"

self.onmessage = (event: MessageEvent<ImageResizeTaskInput>) => {
    void renderImage(event.data)
        .then((result) => {
            self.postMessage({ ok: true, value: result })
        })
        .catch((error) => {
            self.postMessage({
                ok: false,
                error: error instanceof Error ? error.message : "IMAGE_RESIZE_TASK_FAILED",
            })
        })
}

function dataUrlToBlob(dataUrl: string): Blob {
    const match = dataUrl.match(/^data:([^;,]+);base64,([\s\S]+)$/i)
    if (!match) {
        throw new Error("IMAGE_RESIZE_WORKER_UNSUPPORTED")
    }

    const binary = atob(match[2])
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }
    return new Blob([bytes], { type: match[1] })
}

async function renderImage(input: ImageResizeTaskInput): Promise<ImageResizeTaskResult> {
    if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined") {
        throw new Error("IMAGE_RESIZE_WORKER_UNSUPPORTED")
    }

    const bitmap = await createImageBitmap(dataUrlToBlob(input.source))
    const safeWidth = normalizeResizeDimension(input.targetWidth, bitmap.width)
    const safeHeight = normalizeResizeDimension(input.targetHeight, bitmap.height)
    const drawBox = calculateResizeDrawBox(bitmap.width, bitmap.height, safeWidth, safeHeight, input.fitMode)

    const canvas = new OffscreenCanvas(drawBox.canvasWidth, drawBox.canvasHeight)
    const context = canvas.getContext("2d")
    if (!context) {
        bitmap.close()
        throw new Error("IMAGE_RESIZE_CONTEXT_UNAVAILABLE")
    }

    context.clearRect(0, 0, drawBox.canvasWidth, drawBox.canvasHeight)
    context.fillStyle = "rgba(15, 23, 42, 0)"
    context.fillRect(0, 0, drawBox.canvasWidth, drawBox.canvasHeight)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(
        bitmap,
        0,
        0,
        bitmap.width,
        bitmap.height,
        drawBox.offsetX,
        drawBox.offsetY,
        drawBox.drawWidth,
        drawBox.drawHeight,
    )

    const mime = getOutputMimeType(input.format)
    const outputBlob = await canvas.convertToBlob({
        type: mime,
        quality: input.format === "png" ? undefined : input.quality,
    })
    const bytes = await outputBlob.arrayBuffer()
    const result: ImageResizeTaskResult = {
        mime,
        bytes,
        sourceWidth: bitmap.width,
        sourceHeight: bitmap.height,
        outputWidth: drawBox.canvasWidth,
        outputHeight: drawBox.canvasHeight,
    }
    bitmap.close()
    return result
}

export {}
