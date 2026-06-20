import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "regex_generator",
    slug: "regex-generator",
    category: "network-web",
    relatedTools: ["regex_tester", "text_diff_checker", "jsonpath_playground", "url_encode_decode"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["regex generator", "generate regex", "regex pattern builder", "regular expression generator"],
} satisfies ToolMeta
