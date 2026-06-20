import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "letter_counter",
    slug: "letter-counter",
    category: "text-string",
    relatedTools: ["multiple_whitespace_remover", "text_diff_checker", "lorem_ipsum", "slugify_case_converter"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["letter counter", "character counter", "word counter", "text analyzer"],
} satisfies ToolMeta
