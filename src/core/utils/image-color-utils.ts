import { clampRgbChannel, rgbToHex, type RgbChannels } from "@/core/utils/color-utils"

type Bucket = {
    count: number
    r: number
    g: number
    b: number
}

export function averageRgbFromPixels(pixels: Uint8ClampedArray): RgbChannels {
    if (pixels.length < 4) return { r: 0, g: 0, b: 0 }

    let count = 0
    let r = 0
    let g = 0
    let b = 0

    for (let index = 0; index <= pixels.length - 4; index += 4) {
        const alpha = pixels[index + 3]
        if (alpha < 16) continue
        r += pixels[index]
        g += pixels[index + 1]
        b += pixels[index + 2]
        count += 1
    }

    if (count === 0) return { r: 0, g: 0, b: 0 }

    return {
        r: clampRgbChannel(r / count),
        g: clampRgbChannel(g / count),
        b: clampRgbChannel(b / count),
    }
}

export function averageHexFromPixels(pixels: Uint8ClampedArray): string {
    return rgbToHex(averageRgbFromPixels(pixels))
}

export function rgbToString(rgb: RgbChannels): string {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
}

export function extractPaletteFromPixels(pixels: Uint8ClampedArray, colorCount: number): string[] {
    const targetCount = Math.max(2, Math.min(12, Math.round(colorCount)))
    if (pixels.length < 4) return ["#000000", "#FFFFFF"].slice(0, targetCount)

    const buckets = new Map<number, Bucket>()

    for (let index = 0; index <= pixels.length - 4; index += 4) {
        const alpha = pixels[index + 3]
        if (alpha < 32) continue

        const r = pixels[index]
        const g = pixels[index + 1]
        const b = pixels[index + 2]

        const quantizedR = r >> 4
        const quantizedG = g >> 4
        const quantizedB = b >> 4
        const key = (quantizedR << 8) | (quantizedG << 4) | quantizedB

        const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 }
        bucket.count += 1
        bucket.r += r
        bucket.g += g
        bucket.b += b
        buckets.set(key, bucket)
    }

    const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count)
    const dominant = sorted.slice(0, targetCount).map((bucket) => {
        const rgb = {
            r: clampRgbChannel(bucket.r / bucket.count),
            g: clampRgbChannel(bucket.g / bucket.count),
            b: clampRgbChannel(bucket.b / bucket.count),
        }
        return rgbToHex(rgb)
    })

    if (dominant.length >= targetCount) return dominant

    const fallback = averageHexFromPixels(pixels)
    while (dominant.length < targetCount) {
        dominant.push(fallback)
    }
    return dominant
}
