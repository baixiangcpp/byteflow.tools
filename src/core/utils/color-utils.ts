export type RgbChannels = {
    r: number
    g: number
    b: number
}

export function clampRgbChannel(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(255, Math.round(value)))
}

export function clampAlpha(value: number): number {
    if (!Number.isFinite(value)) return 1
    const rounded = Math.round(value * 100) / 100
    return Math.max(0, Math.min(1, rounded))
}

function expandHex(hex: string): string {
    if (hex.length === 3 || hex.length === 4) {
        return hex.split("").map((char) => `${char}${char}`).join("")
    }
    return hex
}

export function parseHexToRgb(input: string): RgbChannels | null {
    const raw = input.trim().replace(/^#/, "")

    if (![3, 4, 6, 8].includes(raw.length)) return null
    if (!/^[0-9a-fA-F]+$/.test(raw)) return null

    const expanded = expandHex(raw)
    const hex = expanded.slice(0, 6)

    const r = Number.parseInt(hex.slice(0, 2), 16)
    const g = Number.parseInt(hex.slice(2, 4), 16)
    const b = Number.parseInt(hex.slice(4, 6), 16)

    if ([r, g, b].some((channel) => Number.isNaN(channel))) return null

    return { r, g, b }
}

export function formatRgba(rgb: RgbChannels, alpha: number): string {
    const normalizedAlpha = clampAlpha(alpha)
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${normalizedAlpha})`
}

function channelToHex(value: number): string {
    return clampRgbChannel(value).toString(16).padStart(2, "0")
}

export function rgbToHex(rgb: RgbChannels): string {
    return `#${channelToHex(rgb.r)}${channelToHex(rgb.g)}${channelToHex(rgb.b)}`.toUpperCase()
}

export function rgbaToHex8(rgb: RgbChannels, alpha: number): string {
    const alphaHex = Math.round(clampAlpha(alpha) * 255).toString(16).padStart(2, "0")
    return `${rgbToHex(rgb)}${alphaHex}`.toUpperCase()
}
