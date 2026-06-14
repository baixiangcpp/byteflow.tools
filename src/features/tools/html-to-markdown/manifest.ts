import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "html_to_markdown",
    slug: "html-to-markdown",
    category: "formatters",
    relatedTools: ["markdown_preview", "html_formatter", "html_encoder_decoder", "text_diff_checker"],
    keywords: ["html to markdown", "convert html to markdown", "html markdown converter", "html2md online"],
} satisfies ToolMeta
