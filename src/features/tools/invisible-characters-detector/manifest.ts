import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "invisible_chars_detector",
    slug: "invisible-characters-detector",
    category: "text-string",
    relatedTools: ["text_diff_checker", "multiple_whitespace_remover", "base64_encode_decode", "url_encode_decode"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["invisible characters detector", "zero width space", "control characters", "unicode detector", "hidden characters finder"],
    searchKeywords: ["invisible chars", "zero width", "zwsp", "hidden space", "control chars", "不可见字符", "零宽字符", "見えない文字", "보이지 않는 문자"],
} satisfies ToolMeta
