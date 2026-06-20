import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "openapi_viewer",
    slug: "openapi-viewer",
    category: "formatters",
    relatedTools: ["json_formatter", "yaml_json_converter", "jsonpath_playground"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["openapi viewer", "swagger viewer online", "openapi explorer", "api spec viewer"],
} satisfies ToolMeta
