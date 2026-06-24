import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "http_request_builder",
    slug: "http-request-builder",
    category: "network-web",
    relatedTools: ["graphql_workbench", "url_parser", "http_status_codes", "url_encode_decode"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    relatedWorkflows: [
        { toolKey: "url_parser", reasonKey: "inspect_request_url" },
        { toolKey: "http_status_codes", reasonKey: "check_expected_status" },
        { toolKey: "url_encode_decode", reasonKey: "encode_query_params" },
    ],
    keywords: ["http request builder", "curl generator", "api request builder", "rest client online"],
    persistInput: false,
} satisfies ToolMeta
