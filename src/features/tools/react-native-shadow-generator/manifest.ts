import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "react_native_shadow_generator",
    slug: "react-native-shadow-generator",
    category: "generators",
    relatedTools: ["css_box_shadow_generator", "css_glassmorphism_generator", "css_border_radius_generator", "color_converter"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["react native shadow generator", "ios shadowoffset shadowradius", "android elevation generator", "react native style shadow"],
} satisfies ToolMeta
