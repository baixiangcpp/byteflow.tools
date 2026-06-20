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

export type ResizeOutputSummaryLabels = {
    aspectLock: string
    fitMode: string
    format: string
    lossless: string
    off: string
    on: string
    quality: string
    source: string
    target: string
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

export function buildResizeOutputSummary({
    fitMode,
    format,
    labels,
    lockAspect,
    quality,
    sourceHeight,
    sourceWidth,
    targetHeight,
    targetWidth,
}: {
    fitMode: ResizeFitMode
    format: ResizeFormat
    labels: ResizeOutputSummaryLabels
    lockAspect: boolean
    quality: number
    sourceHeight: number
    sourceWidth: number
    targetHeight: number
    targetWidth: number
}): string {
    return [
        `${labels.source}: ${sourceWidth || "-"} x ${sourceHeight || "-"}`,
        `${labels.target}: ${targetWidth} x ${targetHeight}`,
        `${labels.fitMode}: ${fitMode}`,
        `${labels.format}: ${format.toUpperCase()}`,
        `${labels.quality}: ${format === "png" ? labels.lossless : quality.toFixed(2)}`,
        `${labels.aspectLock}: ${lockAspect ? labels.on : labels.off}`,
        "",
        `.resized-image {`,
        `  width: ${targetWidth}px;`,
        `  height: ${targetHeight}px;`,
        `  object-fit: ${fitMode === "stretch" ? "fill" : fitMode};`,
        "}",
    ].join("\n")
}
