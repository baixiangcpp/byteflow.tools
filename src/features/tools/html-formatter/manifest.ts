import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "html_formatter",
    slug: "html-formatter",
    category: "formatters",
    relatedTools: ["html_css_beautifier", "xml_formatter", "css_minifier", "markdown_preview"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["html formatter", "beautify html", "format html online", "html pretty print"],
    searchKeywords: ["beautify html", "format html", "html validator", "HTML格式化", "HTML整形", "HTML 포맷", "美化网页"],
} satisfies ToolMeta
