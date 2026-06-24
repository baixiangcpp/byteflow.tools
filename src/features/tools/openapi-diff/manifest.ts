import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "openapi_diff",
    slug: "openapi-diff",
    category: "formatters",
    relatedTools: ["openapi_viewer", "openapi_mock", "yaml_json_converter", "json_diff_viewer"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    sampleInput: "{\"before\":{\"openapi\":\"3.0.3\",\"paths\":{\"/pets\":{\"get\":{\"responses\":{\"200\":{}}}}}},\"after\":{\"openapi\":\"3.0.3\",\"paths\":{\"/pets\":{\"post\":{\"responses\":{\"201\":{}}}}}}}",
    sampleMode: "compare-specs",
    keywords: ["openapi diff", "swagger diff", "api contract diff", "openapi compare"],
    searchKeywords: ["swagger", "contract", "breaking change", "api diff"],
    persistInput: false,
    networkAccess: "none",
} satisfies ToolMeta
