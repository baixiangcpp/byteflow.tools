export function removeExtraWhitespace(input: string): string {
    if (!input.trim()) return ""
    return input.replace(/\s+/g, " ").trim()
}
