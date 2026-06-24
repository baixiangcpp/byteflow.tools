import TurndownService from "turndown"
import { sanitizeHtml } from "@/core/security/sanitize"

const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    strongDelimiter: "**",
})

// Preserve strikethrough tags as markdown tildes.
turndown.addRule("strikethrough", {
    filter: ["del", "s"],
    replacement: (content) => `~~${content}~~`,
})

export function convertHtmlToMarkdown(html: string): string {
    const normalized = html.trim()
    if (!normalized) return ""

    const markdown = turndown.turndown(sanitizeHtml(normalized))
    return markdown.replace(/\n{3,}/g, "\n\n").trim()
}
