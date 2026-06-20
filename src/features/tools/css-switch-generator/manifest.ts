import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_switch_generator",
    slug: "css-switch-generator",
    category: "generators",
    relatedTools: ["css_checkbox_generator", "css_border_radius_generator", "css_glassmorphism_generator", "color_converter"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["css switch generator", "toggle switch css", "custom switch styles", "switch ui generator"],
} satisfies ToolMeta
