import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_clip_path_generator",
    slug: "css-clip-path-generator",
    category: "generators",
    relatedTools: ["css_background_pattern_generator", "css_box_shadow_generator", "color_converter", "svg_optimizer"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["css clip path generator", "polygon clip path", "clip-path css", "shape generator css"],
} satisfies ToolMeta
