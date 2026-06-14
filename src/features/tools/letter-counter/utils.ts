export type LetterCounterStats = {
    characters: number
    charactersNoSpaces: number
    words: number
    lines: number
    letters: number
    digits: number
}

export function getLetterCounterStats(input: string): LetterCounterStats {
    const characters = input.length
    const charactersNoSpaces = input.replace(/\s/g, "").length
    const words = input.trim() ? input.trim().split(/\s+/).length : 0
    const lines = input ? input.split(/\r?\n/).length : 0
    const letters = (input.match(/\p{L}/gu) || []).length
    const digits = (input.match(/\d/g) || []).length

    return {
        characters,
        charactersNoSpaces,
        words,
        lines,
        letters,
        digits,
    }
}

export type LetterCounterSummaryLabels = {
    characters: string
    charactersNoSpaces: string
    words: string
    lines: string
    letters: string
    digits: string
}

const DEFAULT_SUMMARY_LABELS: LetterCounterSummaryLabels = {
    characters: "Characters",
    charactersNoSpaces: "Characters (no spaces)",
    words: "Words",
    lines: "Lines",
    letters: "Letters",
    digits: "Digits",
}

export function formatLetterCounterSummary(
    stats: LetterCounterStats,
    labels: LetterCounterSummaryLabels = DEFAULT_SUMMARY_LABELS,
): string {
    return [
        `${labels.characters}: ${stats.characters}`,
        `${labels.charactersNoSpaces}: ${stats.charactersNoSpaces}`,
        `${labels.words}: ${stats.words}`,
        `${labels.lines}: ${stats.lines}`,
        `${labels.letters}: ${stats.letters}`,
        `${labels.digits}: ${stats.digits}`,
    ].join("\n")
}
