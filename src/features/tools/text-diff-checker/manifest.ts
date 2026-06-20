import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "text_diff_checker",
    slug: "text-diff-checker",
    category: "text-string",
    relatedTools: ["json_diff_viewer", "markdown_preview", "base64_encode_decode"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["text diff", "compare text online", "diff checker", "text comparison tool"],
} satisfies ToolMeta
