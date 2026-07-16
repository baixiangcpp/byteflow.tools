import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "svg_stroke_to_fill_converter",
    slug: "svg-stroke-to-fill-converter",
    inputBehavior: "explicit-sample",
    category: "generators",
    relatedTools: ["svg_optimizer", "svg_blob_generator", "svg_pattern_generator", "svg_to_png_converter"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["svg stroke to fill", "convert stroke to fill svg", "outline to fill svg", "svg path converter"],
} satisfies ToolMeta
