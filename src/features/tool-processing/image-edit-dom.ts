import { loadPolicyCheckedImage } from "@/core/utils/image-canvas-utils"
import { buildCssFilterString, normalizeCropPercent, percentCropToPixels } from "@/core/utils/image-edit-utils"
import { intensityToBlockSize, normalizeCensorRect, percentRectToPixels } from "@/features/tools/photo-censor/utils"
import type { ImageEditTaskInput, ImageEditTaskResult } from "./image-edit-worker-types"

function canvasToPngResult(canvas: HTMLCanvasElement, metadata: string): ImageEditTaskResult {
    return {
        dataUrl: canvas.toDataURL("image/png"),
        width: canvas.width,
        height: canvas.height,
        metadata,
    }
}

function applyPixelateRegion(
    context: CanvasRenderingContext2D,
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
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number,
) {
    const sampleScale = Math.max(0.04, 1 - intensity / 100)
    const tinyWidth = Math.max(1, Math.round(width * sampleScale))
    const tinyHeight = Math.max(1, Math.round(height * sampleScale))
    const temp = document.createElement("canvas")
    temp.width = tinyWidth
    temp.height = tinyHeight
    const tempContext = temp.getContext("2d")
    if (!tempContext) return

    tempContext.imageSmoothingEnabled = true
    tempContext.drawImage(context.canvas, x, y, width, height, 0, 0, tinyWidth, tinyHeight)
    context.imageSmoothingEnabled = true
    context.drawImage(temp, 0, 0, tinyWidth, tinyHeight, x, y, width, height)
}

export async function runImageEditDomTask(input: ImageEditTaskInput): Promise<ImageEditTaskResult> {
    const image = await loadPolicyCheckedImage(input.source)
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    if (!context) throw new Error("2D canvas context unavailable")

    if (input.operation === "filter") {
        const ratio = Math.min(1, (input.maxWidth ?? 980) / image.width)
        canvas.width = Math.max(1, Math.round(image.width * ratio))
        canvas.height = Math.max(1, Math.round(image.height * ratio))
        context.filter = buildCssFilterString(input.filters)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        context.filter = "none"
        return canvasToPngResult(canvas, buildCssFilterString(input.filters))
    }

    if (input.operation === "crop") {
        const safeCrop = normalizeCropPercent(input.crop)
        const pixelRect = percentCropToPixels(image.width, image.height, safeCrop)
        canvas.width = pixelRect.width
        canvas.height = pixelRect.height
        context.drawImage(image, pixelRect.x, pixelRect.y, pixelRect.width, pixelRect.height, 0, 0, pixelRect.width, pixelRect.height)
        return canvasToPngResult(canvas, `${pixelRect.width}x${pixelRect.height}`)
    }

    const safeRect = normalizeCensorRect(input.rect)
    const sourceRect = percentRectToPixels(image.width, image.height, safeRect)
    canvas.width = image.width
    canvas.height = image.height
    context.drawImage(image, 0, 0, image.width, image.height)
    if (input.mode === "pixelate") {
        applyPixelateRegion(context, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, input.intensity)
    } else {
        applyBlurRegion(context, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, input.intensity)
    }
    return canvasToPngResult(canvas, `${sourceRect.width}x${sourceRect.height}`)
}
