import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "markdown_preview",
    slug: "markdown-preview",
    category: "formatters",
    relatedTools: ["html_formatter", "html_css_beautifier", "text_diff_checker", "lorem_ipsum"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["markdown preview", "markdown editor online", "markdown to html", "gfm preview"],
    searchKeywords: ["preview markdown", "markdown viewer", "md preview", "Markdown预览", "Markdown表示", "마크다운 미리보기", "文档预览"],
} satisfies ToolMeta
