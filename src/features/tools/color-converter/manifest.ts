import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "color_converter",
    slug: "color-converter",
    category: "generators",
    relatedTools: ["css_minifier", "html_css_beautifier", "svg_optimizer"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["color converter", "hex to rgb", "hsl converter", "color picker online"],
} satisfies ToolMeta
