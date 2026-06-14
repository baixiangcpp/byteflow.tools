export type ResizeFitMode = "contain" | "cover" | "stretch"
export type ResizeFormat = "png" | "jpeg" | "webp"

export type ResizeDrawBox = {
    canvasWidth: number
    canvasHeight: number
    drawWidth: number
    drawHeight: number
    offsetX: number
    offsetY: number
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
}

export function normalizeResizeDimension(value: number, fallback: number): number {
    return Math.round(clamp(value, 1, 4096)) || fallback
}

export function getOutputMimeType(format: ResizeFormat): string {
    if (format === "jpeg") return "image/jpeg"
    if (format === "webp") return "image/webp"
    return "image/png"
}

export function calculateResizeDrawBox(
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    mode: ResizeFitMode,
): ResizeDrawBox {
    const canvasWidth = normalizeResizeDimension(targetWidth, 1200)
    const canvasHeight = normalizeResizeDimension(targetHeight, 800)
    const srcWidth = Math.max(1, Math.round(sourceWidth))
    const srcHeight = Math.max(1, Math.round(sourceHeight))

    if (mode === "stretch") {
        return {
            canvasWidth,
            canvasHeight,
            drawWidth: canvasWidth,
            drawHeight: canvasHeight,
            offsetX: 0,
            offsetY: 0,
        }
    }

    const ratioX = canvasWidth / srcWidth
    const ratioY = canvasHeight / srcHeight
    const scale = mode === "cover" ? Math.max(ratioX, ratioY) : Math.min(ratioX, ratioY)
    const drawWidth = Math.max(1, Math.round(srcWidth * scale))
    const drawHeight = Math.max(1, Math.round(srcHeight * scale))
    const offsetX = Math.round((canvasWidth - drawWidth) / 2)
    const offsetY = Math.round((canvasHeight - drawHeight) / 2)

    return {
        canvasWidth,
        canvasHeight,
        drawWidth,
        drawHeight,
        offsetX,
        offsetY,
    }
}
