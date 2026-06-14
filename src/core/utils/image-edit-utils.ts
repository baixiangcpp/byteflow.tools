export type CropRectPercent = {
    x: number
    y: number
    width: number
    height: number
}

export type CropRectPixels = {
    x: number
    y: number
    width: number
    height: number
}

export type ImageFilterConfig = {
    brightness: number
    contrast: number
    saturation: number
    grayscale: number
    blur: number
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
}

export function normalizeCropPercent(rect: CropRectPercent): CropRectPercent {
    const width = clamp(Math.round(rect.width), 1, 100)
    const height = clamp(Math.round(rect.height), 1, 100)
    const x = clamp(Math.round(rect.x), 0, 100 - width)
    const y = clamp(Math.round(rect.y), 0, 100 - height)
    return { x, y, width, height }
}

export function percentCropToPixels(
    imageWidth: number,
    imageHeight: number,
    rect: CropRectPercent,
): CropRectPixels {
    const safe = normalizeCropPercent(rect)
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

export function buildCssFilterString(config: ImageFilterConfig): string {
    const brightness = clamp(config.brightness, 0, 250)
    const contrast = clamp(config.contrast, 0, 250)
    const saturation = clamp(config.saturation, 0, 300)
    const grayscale = clamp(config.grayscale, 0, 100)
    const blur = clamp(config.blur, 0, 20)

    return [
        `brightness(${brightness}%)`,
        `contrast(${contrast}%)`,
        `saturate(${saturation}%)`,
        `grayscale(${grayscale}%)`,
        `blur(${blur}px)`,
    ].join(" ")
}
