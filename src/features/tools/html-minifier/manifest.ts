import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "html_minifier",
    slug: "html-minifier",
    category: "formatters",
    relatedTools: ["html_formatter", "html_css_beautifier", "css_minifier", "javascript_minifier"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["html minifier", "minify html", "html compressor", "compress html online"],
} satisfies ToolMeta
