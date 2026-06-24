import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const GLOBALS_CSS = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8")

type Hsl = {
    h: number
    s: number
    l: number
    alpha: number
}

function extractBlock(selector: ":root" | ".dark"): string {
    const match = new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(GLOBALS_CSS)
    if (!match) throw new Error(`Missing ${selector} block`)
    return match[1]
}

function parseHsl(block: string, variableName: string): Hsl {
    const match = new RegExp(`${variableName}:\\s*hsl\\((\\d+)\\s+(\\d+)%\\s+(\\d+)%(?:\\s*/\\s*([0-9.]+))?\\)`).exec(block)
    if (!match) throw new Error(`Missing ${variableName}`)
    return {
        h: Number(match[1]),
        s: Number(match[2]) / 100,
        l: Number(match[3]) / 100,
        alpha: match[4] ? Number(match[4]) : 1,
    }
}

function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
    const chroma = (1 - Math.abs(2 * l - 1)) * s
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - chroma / 2
    const [r1, g1, b1] =
        h < 60 ? [chroma, x, 0] :
            h < 120 ? [x, chroma, 0] :
                h < 180 ? [0, chroma, x] :
                    h < 240 ? [0, x, chroma] :
                        h < 300 ? [x, 0, chroma] :
                            [chroma, 0, x]
    return [r1 + m, g1 + m, b1 + m]
}

function relativeLuminance(hsl: Hsl): number {
    const [r, g, b] = hslToRgb(hsl).map((channel) => (
        channel <= 0.03928
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4
    ))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function blendOver(foreground: Hsl, background: Hsl): Hsl {
    if (foreground.alpha >= 1) return foreground
    const fg = hslToRgb(foreground)
    const bg = hslToRgb(background)
    const rgb = fg.map((channel, index) => (channel * foreground.alpha) + (bg[index] * (1 - foreground.alpha)))
    const max = Math.max(...rgb)
    const min = Math.min(...rgb)
    const l = (max + min) / 2
    const delta = max - min
    const s = delta === 0 ? 0 : delta / (1 - Math.abs((2 * l) - 1))
    return { h: 0, s, l, alpha: 1 }
}

function contrastRatio(text: Hsl, background: Hsl): number {
    const textLum = relativeLuminance(blendOver(text, background))
    const bgLum = relativeLuminance(background)
    const lighter = Math.max(textLum, bgLum)
    const darker = Math.min(textLum, bgLum)
    return (lighter + 0.05) / (darker + 0.05)
}

describe("theme contrast tokens", () => {
    it("keeps foreground and muted text above WCAG AA contrast in light and dark themes", () => {
        for (const selector of [":root", ".dark"] as const) {
            const block = extractBlock(selector)
            const background = parseHsl(block, "--background")
            const foreground = parseHsl(block, "--foreground")
            const mutedForeground = parseHsl(block, "--muted-foreground")

            expect(contrastRatio(foreground, background), `${selector} foreground`).toBeGreaterThanOrEqual(4.5)
            expect(contrastRatio(mutedForeground, background), `${selector} muted foreground`).toBeGreaterThanOrEqual(4.5)
        }
    })
})
