import { sanitizeMarkdownHtml } from "@/core/security/sanitize"

type MarkdownExportDocumentInput = {
    lang: string
    title: string
    previewHtml: string
}

function escapeHtmlText(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
}

export function sanitizeMarkdownPreviewHtml(previewHtml: string): string {
    return sanitizeMarkdownHtml(previewHtml)
}

export function buildMarkdownExportDocument({
    lang,
    title,
    previewHtml,
}: MarkdownExportDocumentInput): string {
    const safeHtml = sanitizeMarkdownPreviewHtml(previewHtml)
    const safeTitle = escapeHtmlText(title)
    const safeLang = lang.replace(/[^A-Za-z0-9-]/g, "")

    return `<!DOCTYPE html>
<html lang="${safeLang || "en"}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="generator" content="byteflow.tools Markdown Preview">
<title>${safeTitle}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }
pre { background: #f4f4f4; padding: 1rem; border-radius: 6px; overflow-x: auto; }
code { font-family: 'JetBrains Mono', monospace; font-size: 0.9em; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
th { background: #f0f0f0; }
blockquote { border-left: 4px solid #3b82f6; margin: 1rem 0; padding: 0.5rem 1rem; background: #f8f9fa; }
img { max-width: 100%; }
</style>
</head>
<body>
${safeHtml}
</body>
</html>`
}
