import { loadImageElement } from "@/core/utils/image-canvas-utils"
import { calculateResizeDrawBox, getOutputMimeType, normalizeResizeDimension } from "./utils"
import type { ImageResizeTaskInput } from "./image-resize-task-types"

export async function renderImageResizeDataUrlDom(input: ImageResizeTaskInput): Promise<{
    dataUrl: string
    sourceWidth: number
    sourceHeight: number
    outputWidth: number
    outputHeight: number
}> {
    const image = await loadImageElement(input.source)
    const safeWidth = normalizeResizeDimension(input.targetWidth, image.width)
    const safeHeight = normalizeResizeDimension(input.targetHeight, image.height)
    const drawBox = calculateResizeDrawBox(image.width, image.height, safeWidth, safeHeight, input.fitMode)

    const canvas = document.createElement("canvas")
    canvas.width = drawBox.canvasWidth
    canvas.height = drawBox.canvasHeight
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas context unavailable")

    context.clearRect(0, 0, drawBox.canvasWidth, drawBox.canvasHeight)
    context.fillStyle = "rgba(15, 23, 42, 0)"
    context.fillRect(0, 0, drawBox.canvasWidth, drawBox.canvasHeight)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(
        image,
        0,
        0,
        image.width,
        image.height,
        drawBox.offsetX,
        drawBox.offsetY,
        drawBox.drawWidth,
        drawBox.drawHeight,
    )

    const mime = getOutputMimeType(input.format)
    return {
        dataUrl: input.format === "png" ? canvas.toDataURL(mime) : canvas.toDataURL(mime, input.quality),
        sourceWidth: image.width,
        sourceHeight: image.height,
        outputWidth: drawBox.canvasWidth,
        outputHeight: drawBox.canvasHeight,
    }
}
