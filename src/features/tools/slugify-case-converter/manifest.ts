import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "slugify_case_converter",
    slug: "slugify-case-converter",
    category: "text-string",
    relatedTools: ["url_encode_decode", "base64_encode_decode", "hash_generator", "text_diff_checker"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["slugify", "case converter", "camelcase converter", "snake case to camel case"],
} satisfies ToolMeta
