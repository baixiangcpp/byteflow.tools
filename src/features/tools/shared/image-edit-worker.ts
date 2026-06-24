import { buildCssFilterString, normalizeCropPercent, percentCropToPixels } from "@/core/utils/image-edit-utils"
import { intensityToBlockSize, normalizeCensorRect, percentRectToPixels } from "@/features/tools/photo-censor/utils"
import type { ImageEditTaskInput, ImageEditTaskResult } from "./image-edit-worker-types"

type WorkerPostMessage = (message: unknown) => void

const postWorkerMessage = self.postMessage.bind(self) as WorkerPostMessage

self.onmessage = (event: MessageEvent<ImageEditTaskInput>) => {
    void runImageEdit(event.data)
        .then((result) => {
            postWorkerMessage({ ok: true, value: result })
        })
        .catch((error) => {
            postWorkerMessage({
                ok: false,
                error: error instanceof Error ? error.message : "IMAGE_EDIT_TASK_FAILED",
            })
        })
}

function dataUrlToBlob(dataUrl: string): Blob {
    const match = dataUrl.match(/^data:([^;,]+);base64,([\s\S]+)$/i)
    if (!match) throw new Error("IMAGE_EDIT_UNSUPPORTED_SOURCE")

    const binary = atob(match[2])
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }
    return new Blob([bytes], { type: match[1] })
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = ""
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte)
    })
    return btoa(binary)
}

async function canvasToDataUrl(canvas: OffscreenCanvas): Promise<string> {
    const blob = await canvas.convertToBlob({ type: "image/png" })
    return `data:image/png;base64,${bytesToBase64(new Uint8Array(await blob.arrayBuffer()))}`
}

function applyPixelateRegion(
    context: OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number,
) {
    const block = intensityToBlockSize(intensity)
    const sampled = context.getImageData(x, y, width, height)
    const { data } = sampled

    for (let by = 0; by < height; by += block) {
        for (let bx = 0; bx < width; bx += block) {
            const baseIndex = (by * width + bx) * 4
            const r = data[baseIndex]
            const g = data[baseIndex + 1]
            const b = data[baseIndex + 2]
            const a = data[baseIndex + 3] / 255
            context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
            context.fillRect(x + bx, y + by, block, block)
        }
    }
}

function applyBlurRegion(
    context: OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number,
) {
    const sampleScale = Math.max(0.04, 1 - intensity / 100)
    const tinyWidth = Math.max(1, Math.round(width * sampleScale))
    const tinyHeight = Math.max(1, Math.round(height * sampleScale))
    const temp = new OffscreenCanvas(tinyWidth, tinyHeight)
    const tempContext = temp.getContext("2d")
    if (!tempContext) return

    tempContext.imageSmoothingEnabled = true
    tempContext.drawImage(context.canvas, x, y, width, height, 0, 0, tinyWidth, tinyHeight)
    context.imageSmoothingEnabled = true
    context.drawImage(temp, 0, 0, tinyWidth, tinyHeight, x, y, width, height)
}

async function runImageEdit(input: ImageEditTaskInput): Promise<ImageEditTaskResult> {
    if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined") {
        throw new Error("IMAGE_EDIT_WORKER_UNSUPPORTED")
    }

    const bitmap = await createImageBitmap(dataUrlToBlob(input.source))

    try {
        if (input.operation === "filter") {
            const ratio = Math.min(1, (input.maxWidth ?? 980) / bitmap.width)
            const width = Math.max(1, Math.round(bitmap.width * ratio))
            const height = Math.max(1, Math.round(bitmap.height * ratio))
            const canvas = new OffscreenCanvas(width, height)
            const context = canvas.getContext("2d")
            if (!context) throw new Error("IMAGE_EDIT_CONTEXT_UNAVAILABLE")
            const metadata = buildCssFilterString(input.filters)
            context.filter = metadata
            context.drawImage(bitmap, 0, 0, width, height)
            context.filter = "none"
            return { dataUrl: await canvasToDataUrl(canvas), width, height, metadata }
        }

        if (input.operation === "crop") {
            const safeCrop = normalizeCropPercent(input.crop)
            const pixelRect = percentCropToPixels(bitmap.width, bitmap.height, safeCrop)
            const canvas = new OffscreenCanvas(pixelRect.width, pixelRect.height)
            const context = canvas.getContext("2d")
            if (!context) throw new Error("IMAGE_EDIT_CONTEXT_UNAVAILABLE")
            context.drawImage(bitmap, pixelRect.x, pixelRect.y, pixelRect.width, pixelRect.height, 0, 0, pixelRect.width, pixelRect.height)
            return {
                dataUrl: await canvasToDataUrl(canvas),
                width: pixelRect.width,
                height: pixelRect.height,
                metadata: `${pixelRect.width}x${pixelRect.height}`,
            }
        }

        const safeRect = normalizeCensorRect(input.rect)
        const sourceRect = percentRectToPixels(bitmap.width, bitmap.height, safeRect)
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
        const context = canvas.getContext("2d")
        if (!context) throw new Error("IMAGE_EDIT_CONTEXT_UNAVAILABLE")
        context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height)
        if (input.mode === "pixelate") {
            applyPixelateRegion(context, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, input.intensity)
        } else {
            applyBlurRegion(context, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, input.intensity)
        }
        return {
            dataUrl: await canvasToDataUrl(canvas),
            width: bitmap.width,
            height: bitmap.height,
            metadata: `${sourceRect.width}x${sourceRect.height}`,
        }
    } finally {
        bitmap.close()
    }
}

export {}
