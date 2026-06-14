export type CensorMode = "pixelate" | "blur"

export type CensorRectPercent = {
    x: number
    y: number
    width: number
    height: number
}

export type CensorRectPixels = {
    x: number
    y: number
    width: number
    height: number
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
}

export function normalizeCensorRect(rect: CensorRectPercent): CensorRectPercent {
    const width = clamp(Math.round(rect.width), 5, 100)
    const height = clamp(Math.round(rect.height), 5, 100)
    const x = clamp(Math.round(rect.x), 0, 100 - width)
    const y = clamp(Math.round(rect.y), 0, 100 - height)
    return { x, y, width, height }
}

export function percentRectToPixels(
    imageWidth: number,
    imageHeight: number,
    rect: CensorRectPercent,
): CensorRectPixels {
    const safe = normalizeCensorRect(rect)
    const x = Math.round((safe.x / 100) * imageWidth)
    const y = Math.round((safe.y / 100) * imageHeight)
    const width = Math.max(1, Math.round((safe.width / 100) * imageWidth))
    const height = Math.max(1, Math.round((safe.height / 100) * imageHeight))

    return {
        x: clamp(x, 0, Math.max(0, imageWidth - 1)),
        y: clamp(y, 0, Math.max(0, imageHeight - 1)),
        width: clamp(width, 1, imageWidth),
        height: clamp(height, 1, imageHeight),
    }
}

export function intensityToBlockSize(intensity: number): number {
    return clamp(Math.round(4 + (clamp(intensity, 1, 100) / 100) * 44), 4, 48)
}
