export function minifyHtml(input: string): string {
    if (!input.trim()) return ""

    return input
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/\s+/g, " ")
        .replace(/>\s+</g, "><")
        .trim()
}
