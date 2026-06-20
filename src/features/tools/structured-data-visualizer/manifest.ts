import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "structured_data_visualizer",
    slug: "structured-data-visualizer",
    category: "formatters",
    relatedTools: ["json_formatter", "yaml_json_converter", "xml_formatter", "jsonpath_playground"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["structured data visualizer", "json tree", "yaml tree", "xml tree", "data graph"],
} satisfies ToolMeta
