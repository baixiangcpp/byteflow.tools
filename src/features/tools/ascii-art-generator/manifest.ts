import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "ascii_art_generator",
    slug: "ascii-art-generator",
    category: "generators",
    relatedTools: ["lorem_ipsum", "markdown_preview", "text_diff_checker"],
    keywords: ["ascii art generator", "text to ascii art", "figlet online"],
} satisfies ToolMeta
