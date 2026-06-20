import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_cubic_bezier_generator",
    slug: "css-cubic-bezier-generator",
    category: "generators",
    relatedTools: ["css_box_shadow_generator", "css_clip_path_generator", "css_checkbox_generator", "css_minifier"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["css cubic bezier generator", "easing curve generator", "transition timing function", "cubic bezier tool"],
} satisfies ToolMeta
