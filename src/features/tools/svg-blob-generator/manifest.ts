import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "svg_blob_generator",
    slug: "svg-blob-generator",
    category: "generators",
    relatedTools: ["svg_pattern_generator", "svg_stroke_to_fill_converter", "svg_optimizer", "css_clip_path_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["svg blob generator", "organic svg shape", "blob path generator", "random blob svg"],
} satisfies ToolMeta
