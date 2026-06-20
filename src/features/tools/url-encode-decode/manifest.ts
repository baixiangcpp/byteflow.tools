import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "url_encode_decode",
    slug: "url-encode-decode",
    category: "text-string",
    relatedTools: ["base64_encode_decode", "jwt_decoder", "user_agent_parser"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["url encode", "url decode", "percent encoding", "url encoder online"],
    searchKeywords: ["encode url", "decode url", "percent encode", "url safe", "编码", "解码", "百分比编码", "URLエンコード", "URLデコード", "URL 인코딩", "URL 디코딩"],
} satisfies ToolMeta
