import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "xml_formatter",
    slug: "xml-formatter",
    category: "formatters",
    relatedTools: ["json_formatter", "html_css_beautifier", "yaml_json_converter", "sql_formatter"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["xml formatter", "xml beautifier", "format xml online", "xml pretty print"],
    searchKeywords: ["beautify xml", "format xml", "xml validator", "XML格式化", "XML整形", "XML 포맷", "验证XML"],
} satisfies ToolMeta
