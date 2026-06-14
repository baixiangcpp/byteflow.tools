export type OpenGraphInput = {
    title: string
    description: string
    url: string
    image: string
    type: string
    siteName: string
    twitterCard: "summary" | "summary_large_image"
    twitterSite: string
}

function collapseWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim()
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}

export function normalizeAbsoluteHttpUrl(raw: string): string | null {
    const value = raw.trim()
    if (!value) return null

    try {
        const url = new URL(value)
        if (url.protocol !== "https:" && url.protocol !== "http:") return null
        return url.toString()
    } catch {
        return null
    }
}

export function buildOpenGraphMetaTags(input: OpenGraphInput): string {
    const title = escapeHtml(collapseWhitespace(input.title))
    const description = escapeHtml(collapseWhitespace(input.description))
    const siteName = escapeHtml(collapseWhitespace(input.siteName))
    const url = normalizeAbsoluteHttpUrl(input.url) || ""
    const image = normalizeAbsoluteHttpUrl(input.image) || ""
    const type = collapseWhitespace(input.type || "website")
    const twitterSite = collapseWhitespace(input.twitterSite)

    const lines = [
        `<meta property="og:title" content="${title}" />`,
        `<meta property="og:description" content="${description}" />`,
        `<meta property="og:type" content="${type}" />`,
        url ? `<meta property="og:url" content="${escapeHtml(url)}" />` : "",
        image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : "",
        siteName ? `<meta property="og:site_name" content="${siteName}" />` : "",
        `<meta name="twitter:card" content="${input.twitterCard}" />`,
        `<meta name="twitter:title" content="${title}" />`,
        `<meta name="twitter:description" content="${description}" />`,
        image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : "",
        twitterSite ? `<meta name="twitter:site" content="${escapeHtml(twitterSite)}" />` : "",
    ].filter(Boolean)

    return lines.join("\n")
}

export function buildOpenGraphSnippetDocument(metaTags: string): string {
    return [
        "<!-- Paste these tags inside your <head> -->",
        metaTags,
    ].join("\n")
}
