export type LoremUnits = "paragraphs" | "sentences" | "words"
export type LoremFormat = "plain" | "html"

export type LoremPreset = {
    id: "layout" | "article" | "microcopy" | "html"
    count: number
    units: LoremUnits
    format: LoremFormat
}

export const LOREM_PRESETS: LoremPreset[] = [
    { id: "layout", count: 3, units: "paragraphs", format: "plain" },
    { id: "article", count: 8, units: "paragraphs", format: "plain" },
    { id: "microcopy", count: 12, units: "sentences", format: "plain" },
    { id: "html", count: 4, units: "paragraphs", format: "html" },
]

export function clampLoremCount(value: number): number {
    if (!Number.isFinite(value)) return 1
    return Math.min(Math.max(1, Math.floor(value)), 1000)
}

export function splitPlainParagraphs(text: string): string[] {
    return text
        .split(/\n+/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
}

export function formatParagraphOutput(paragraphs: string[], format: LoremFormat): string {
    if (format === "html") {
        return paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("\n")
    }

    return paragraphs.join("\n\n")
}
