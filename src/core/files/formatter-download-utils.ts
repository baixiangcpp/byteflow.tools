export type FormatterMode = "html" | "css"
export type FormatterAction = "format" | "minify" | null

export type FormatterDownloadConfig = {
    filename: string
    mimeType: string
    content: string
}

export function buildFormatterDownloadConfig({
    mode,
    lastAction,
    content,
}: {
    mode: FormatterMode
    lastAction: FormatterAction
    content: string
}): FormatterDownloadConfig | null {
    if (!content) return null

    if (mode === "html") {
        return {
            filename: lastAction === "minify" ? "markup.min.html" : "markup.formatted.html",
            mimeType: "text/html;charset=utf-8",
            content,
        }
    }

    return {
        filename: lastAction === "minify" ? "style.min.css" : "style.formatted.css",
        mimeType: "text/css;charset=utf-8",
        content,
    }
}
