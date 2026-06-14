import { clampRgbChannel, parseHexToRgb, rgbToHex, type RgbChannels } from "@/core/utils/color-utils"

export type PaletteProfile = "default" | "ocean" | "sunset" | "forest" | "cyber" | "pastel"

export type ShadeToken = {
    label: string
    color: string
}

const FALLBACK_HEX = "#3B82F6"

const PROFILE_OFFSETS: Record<PaletteProfile, number[]> = {
    default: [0, -18, 18, 34, -34, 120, 156, 198],
    ocean: [0, -12, 16, 28, 46, 128, 168, 200],
    sunset: [0, 18, 36, 54, -22, 140, 176, 210],
    forest: [0, -16, 14, 32, -46, 116, 150, 188],
    cyber: [0, 24, 50, 78, -26, 146, 184, 220],
    pastel: [0, -14, 14, 30, -30, 110, 148, 186],
}

const PROFILE_SATURATION_SHIFT: Record<PaletteProfile, number> = {
    default: 0,
    ocean: 8,
    sunset: 12,
    forest: 4,
    cyber: 18,
    pastel: -18,
}

const PROFILE_LIGHTNESS_SHIFT: Record<PaletteProfile, number> = {
    default: 0,
    ocean: -2,
    sunset: 4,
    forest: -4,
    cyber: 2,
    pastel: 12,
}

const PROFILE_KEYWORDS: Record<Exclude<PaletteProfile, "default">, string[]> = {
    ocean: ["ocean", "sea", "aqua", "海洋", "海", "바다", "ozean", "meer", "océan", "mer"],
    sunset: ["sunset", "warm", "orange", "日落", "夕焼け", "노을", "sonnenuntergang", "abendrot", "coucher"],
    forest: ["forest", "nature", "green", "森林", "自然", "森", "숲", "wald", "forêt"],
    cyber: ["cyber", "neon", "tech", "赛博", "賽博", "科技", "サイバー", "네온", "technik", "néon"],
    pastel: ["pastel", "soft", "柔和", "柔らか", "파스텔", "pastell", "doux"],
}

function clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(1, value))
}

function normalizeHex(input: string): string {
    const parsed = parseHexToRgb(input)
    if (!parsed) return FALLBACK_HEX
    return rgbToHex(parsed)
}

function rgbToHsl(rgb: RgbChannels): { h: number; s: number; l: number } {
    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    const lightness = (max + min) / 2

    if (delta === 0) {
        return { h: 0, s: 0, l: lightness * 100 }
    }

    const saturation = delta / (1 - Math.abs(2 * lightness - 1))
    let hue = 0

    switch (max) {
        case r:
            hue = ((g - b) / delta) % 6
            break
        case g:
            hue = (b - r) / delta + 2
            break
        default:
            hue = (r - g) / delta + 4
            break
    }

    hue = Math.round((hue * 60 + 360) % 360)
    return { h: hue, s: saturation * 100, l: lightness * 100 }
}

function hslToRgb(h: number, s: number, l: number): RgbChannels {
    const hue = ((h % 360) + 360) % 360
    const saturation = clamp01(s / 100)
    const lightness = clamp01(l / 100)

    const c = (1 - Math.abs(2 * lightness - 1)) * saturation
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
    const m = lightness - c / 2

    let rPrime = 0
    let gPrime = 0
    let bPrime = 0

    if (hue < 60) {
        rPrime = c
        gPrime = x
    } else if (hue < 120) {
        rPrime = x
        gPrime = c
    } else if (hue < 180) {
        gPrime = c
        bPrime = x
    } else if (hue < 240) {
        gPrime = x
        bPrime = c
    } else if (hue < 300) {
        rPrime = x
        bPrime = c
    } else {
        rPrime = c
        bPrime = x
    }

    return {
        r: clampRgbChannel((rPrime + m) * 255),
        g: clampRgbChannel((gPrime + m) * 255),
        b: clampRgbChannel((bPrime + m) * 255),
    }
}

function blendRgb(a: RgbChannels, b: RgbChannels, ratio: number): RgbChannels {
    const t = clamp01(ratio)
    return {
        r: clampRgbChannel(a.r + (b.r - a.r) * t),
        g: clampRgbChannel(a.g + (b.g - a.g) * t),
        b: clampRgbChannel(a.b + (b.b - a.b) * t),
    }
}

function detectProfile(keyword: string): PaletteProfile {
    const key = keyword.trim().toLowerCase()
    if (!key) return "default"

    for (const [profile, keywords] of Object.entries(PROFILE_KEYWORDS) as [Exclude<PaletteProfile, "default">, string[]][]) {
        if (keywords.some((term) => key.includes(term))) {
            return profile
        }
    }

    return "default"
}

export function mixColorsRgb(hexA: string, hexB: string, ratio: number): string {
    const a = parseHexToRgb(hexA) ?? parseHexToRgb(FALLBACK_HEX)!
    const b = parseHexToRgb(hexB) ?? a
    return rgbToHex(blendRgb(a, b, ratio))
}

export function mixColorsHsl(hexA: string, hexB: string, ratio: number): string {
    const a = parseHexToRgb(hexA) ?? parseHexToRgb(FALLBACK_HEX)!
    const b = parseHexToRgb(hexB) ?? a
    const hslA = rgbToHsl(a)
    const hslB = rgbToHsl(b)
    const t = clamp01(ratio)

    let hueDelta = hslB.h - hslA.h
    if (Math.abs(hueDelta) > 180) {
        hueDelta -= Math.sign(hueDelta) * 360
    }

    const hue = (hslA.h + hueDelta * t + 360) % 360
    const saturation = hslA.s + (hslB.s - hslA.s) * t
    const lightness = hslA.l + (hslB.l - hslA.l) * t

    return rgbToHex(hslToRgb(hue, saturation, lightness))
}

export function generateAiPalette(seedHex: string, keyword: string, count = 8): string[] {
    const baseHex = normalizeHex(seedHex)
    const baseRgb = parseHexToRgb(baseHex)!
    const baseHsl = rgbToHsl(baseRgb)
    const profile = detectProfile(keyword)
    const safeCount = Math.max(5, Math.min(12, Math.round(count)))

    const offsets = PROFILE_OFFSETS[profile]
    const saturationShift = PROFILE_SATURATION_SHIFT[profile]
    const lightnessShift = PROFILE_LIGHTNESS_SHIFT[profile]

    return Array.from({ length: safeCount }).map((_, index) => {
        const offset = offsets[index % offsets.length]
        const wave = Math.sin((index / Math.max(1, safeCount - 1)) * Math.PI)
        const hue = (baseHsl.h + offset + 360) % 360
        const saturation = Math.max(18, Math.min(96, baseHsl.s + saturationShift + (wave - 0.5) * 14))
        const lightness = Math.max(16, Math.min(92, baseHsl.l + lightnessShift + (0.5 - wave) * 24))
        return rgbToHex(hslToRgb(hue, saturation, lightness))
    })
}

export function generateColorShades(seedHex: string, steps = 10): ShadeToken[] {
    const baseHex = normalizeHex(seedHex)
    const baseRgb = parseHexToRgb(baseHex)!
    const safeSteps = Math.max(10, Math.min(12, Math.round(steps)))

    const labels = safeSteps === 10
        ? ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"]
        : ["25", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]

    return labels.map((label, index) => {
        const t = index / (labels.length - 1)
        const shade = t <= 0.5
            ? blendRgb({ r: 255, g: 255, b: 255 }, baseRgb, t * 2 * 0.92)
            : blendRgb(baseRgb, { r: 0, g: 0, b: 0 }, (t - 0.5) * 2 * 0.86)

        return { label, color: rgbToHex(shade) }
    })
}

export function paletteToCssVars(colors: string[], prefix = "--palette"): string {
    return colors.map((color, index) => `${prefix}-${index + 1}: ${normalizeHex(color)};`).join("\n")
}

export function shadesToCssVars(shades: ShadeToken[], prefix = "--color"): string {
    return shades.map((item) => `${prefix}-${item.label}: ${normalizeHex(item.color)};`).join("\n")
}
