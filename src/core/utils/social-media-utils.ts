export type SocialTheme = "light" | "dark"

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
}

export function formatCompactNumber(value: number): string {
    const safe = Math.max(0, Math.floor(value))
    if (safe >= 1_000_000_000) return `${(safe / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`
    if (safe >= 1_000_000) return `${(safe / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    if (safe >= 1_000) return `${(safe / 1_000).toFixed(1).replace(/\.0$/, "")}K`
    return `${safe}`
}

export function wrapLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
    const safeChars = Math.max(8, Math.floor(maxCharsPerLine))
    const safeLines = Math.max(1, Math.floor(maxLines))
    const words = text.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return [""]

    const lines: string[] = []
    let current = ""

    for (const word of words) {
        const test = current ? `${current} ${word}` : word
        if (test.length <= safeChars) {
            current = test
            continue
        }
        if (current) lines.push(current)
        current = word
        if (lines.length === safeLines) break
    }

    if (lines.length < safeLines && current) {
        lines.push(current)
    }

    if (lines.length > safeLines) {
        lines.length = safeLines
    }

    if (words.join(" ").length > lines.join(" ").length) {
        const last = lines[lines.length - 1] || ""
        const trimmed = last.length > 3 ? last.slice(0, Math.max(0, safeChars - 1)).trimEnd() : last
        lines[lines.length - 1] = `${trimmed}…`
    }

    return lines
}

export function resolveSocialThemeColors(theme: SocialTheme): {
    surface: string
    subtle: string
    textPrimary: string
    textMuted: string
    border: string
} {
    if (theme === "dark") {
        return {
            surface: "#09090b",
            subtle: "#121217",
            textPrimary: "#fafafa",
            textMuted: "#a1a1aa",
            border: "#27272a",
        }
    }
    return {
        surface: "#ffffff",
        subtle: "#f5f5f7",
        textPrimary: "#09090b",
        textMuted: "#52525b",
        border: "#e4e4e7",
    }
}

export function normalizeProgress(value: number, max = 1): number {
    return clamp(value, 0, max)
}
