export type ScanEnhanceConfig = {
    brightness: number
    contrast: number
    grayscale: number
    thresholdEnabled: boolean
    threshold: number
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
}

export function buildScanFilterString(config: ScanEnhanceConfig): string {
    const brightness = clamp(config.brightness, 40, 200)
    const contrast = clamp(config.contrast, 40, 260)
    const grayscale = clamp(config.grayscale, 0, 100)
    return `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%)`
}

export function applyThresholdToRgba(rgba: Uint8ClampedArray, threshold: number): Uint8ClampedArray {
    const cut = clamp(threshold, 0, 255)
    const out = new Uint8ClampedArray(rgba)

    for (let i = 0; i < out.length; i += 4) {
        const r = out[i]
        const g = out[i + 1]
        const b = out[i + 2]
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
        const value = luminance >= cut ? 255 : 0
        out[i] = value
        out[i + 1] = value
        out[i + 2] = value
    }

    return out
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
    const match = dataUrl.match(/^data:[^;]+;base64,([\s\S]+)$/i)
    if (!match) {
        throw new Error("Invalid data URL")
    }
    return Uint8Array.from(Buffer.from(match[1], "base64"))
}
