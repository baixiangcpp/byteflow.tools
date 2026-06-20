import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "bionic_reading_converter",
    slug: "bionic-reading-converter",
    category: "text-string",
    relatedTools: ["letter_counter", "multiple_whitespace_remover", "markdown_preview", "text_diff_checker"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["bionic reading converter", "speed reading text", "bionic text generator", "focus reading tool"],
} satisfies ToolMeta
