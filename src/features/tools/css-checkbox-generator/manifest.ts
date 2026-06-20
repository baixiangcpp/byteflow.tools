import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_checkbox_generator",
    slug: "css-checkbox-generator",
    category: "generators",
    relatedTools: ["css_border_radius_generator", "css_box_shadow_generator", "css_background_pattern_generator", "color_converter"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["css checkbox generator", "custom checkbox css", "checkbox style maker", "checkbox ui generator"],
} satisfies ToolMeta
