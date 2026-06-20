import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "multiple_whitespace_remover",
    slug: "multiple-whitespace-remover",
    category: "text-string",
    relatedTools: ["text_diff_checker", "slugify_case_converter", "markdown_preview", "lorem_ipsum"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["remove extra spaces", "whitespace remover", "collapse whitespace", "trim text online"],
} satisfies ToolMeta
