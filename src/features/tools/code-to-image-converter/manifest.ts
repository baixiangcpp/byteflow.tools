import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "code_to_image_converter",
    slug: "code-to-image-converter",
    category: "text-string",
    relatedTools: ["markdown_preview", "ascii_art_generator", "json_formatter", "html_formatter"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["code to image", "snippet to png", "source code screenshot", "code image generator"],
} satisfies ToolMeta
