import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "graphql_workbench",
    slug: "graphql-workbench",
    category: "network-web",
    relatedTools: ["http_request_builder", "openapi_viewer", "json_formatter", "jsonpath_playground"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    sampleInput: "query GetUser($id: ID!) { user(id: $id) { id name email } }",
    sampleMode: "format-query",
    keywords: ["graphql formatter", "graphql explorer", "graphql query formatter", "graphql variables validator"],
    searchKeywords: ["graphql", "query", "mutation", "fragment", "introspection"],
    persistInput: false,
    networkAccess: "none",
} satisfies ToolMeta
