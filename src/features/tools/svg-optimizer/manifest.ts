import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "svg_optimizer",
    slug: "svg-optimizer",
    category: "formatters",
    relatedTools: ["css_minifier", "html_css_beautifier", "image_base64"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["svg optimizer", "svgo online", "optimize svg", "compress svg"],
} satisfies ToolMeta
