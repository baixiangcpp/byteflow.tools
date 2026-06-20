import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "svg_pattern_generator",
    slug: "svg-pattern-generator",
    category: "generators",
    relatedTools: ["svg_blob_generator", "svg_optimizer", "css_background_pattern_generator", "css_gradient_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["svg pattern generator", "seamless svg pattern", "tileable pattern svg", "svg texture generator"],
} satisfies ToolMeta
