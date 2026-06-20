import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "ascii_art_generator",
    slug: "ascii-art-generator",
    category: "generators",
    relatedTools: ["lorem_ipsum", "markdown_preview", "text_diff_checker"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["ascii art generator", "text to ascii art", "figlet online"],
} satisfies ToolMeta
