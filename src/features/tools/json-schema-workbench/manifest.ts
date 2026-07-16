import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "json_schema_workbench",
    slug: "json-schema-workbench",
    inputBehavior: "explicit-sample",
    category: "formatters",
    relatedTools: ["json_formatter", "jsonpath_playground", "json_diff_viewer", "json_to_typescript"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    sampleInput: "{\"user\":{\"id\":1001,\"email\":\"alice@example.com\",\"active\":true}}",
    sampleMode: "generate-schema",
    keywords: ["json schema generator", "basic json schema checks", "json schema workbench", "validate json schema"],
    searchKeywords: ["schema", "json schema", "basic validator", "contract"],
    persistInput: false,
    networkAccess: "none",
} satisfies ToolMeta
