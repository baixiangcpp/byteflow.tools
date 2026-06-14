import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "bionic_reading_converter",
    slug: "bionic-reading-converter",
    category: "text-string",
    relatedTools: ["letter_counter", "multiple_whitespace_remover", "markdown_preview", "text_diff_checker"],
    keywords: ["bionic reading converter", "speed reading text", "bionic text generator", "focus reading tool"],
} satisfies ToolMeta
