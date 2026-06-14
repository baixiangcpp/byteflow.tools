import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "openapi_viewer",
    slug: "openapi-viewer",
    category: "formatters",
    relatedTools: ["json_formatter", "yaml_json_converter", "jsonpath_playground"],
    keywords: ["openapi viewer", "swagger viewer online", "openapi explorer", "api spec viewer"],
} satisfies ToolMeta
