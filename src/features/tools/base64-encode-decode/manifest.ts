import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "base64_encode_decode",
    slug: "base64-encode-decode",
    category: "text-string",
    relatedTools: ["url_encode_decode", "jwt_decoder", "hash_generator", "image_base64"],
    relatedWorkflows: [
        { toolKey: "jwt_decoder", reasonKey: "inspect_decoded_token", handoffSupported: true },
        { toolKey: "url_encode_decode", reasonKey: "decode_url_payloads", handoffSupported: true },
        { toolKey: "hash_generator", reasonKey: "verify_decoded_payload", handoffSupported: true },
    ],
    sampleInput: "user_001|zh-CN|text",
    sampleMode: "text:encode",
    inputSizePolicy: {
        warnAtBytes: 5242880,
        workerAtBytes: 1048576,
        hardLimitBytes: 10485760,
        streamingSupported: false,
    },
    keywords: ["base64 encode", "base64 decode", "base64 converter online"],
    searchKeywords: ["encode base64", "decode base64", "base64 decoder", "base64 encoder", "编码", "解码", "base64解码", "base64编码", "转码", "Base64デコード", "Base64エンコード", "Base64 디코딩", "Base64 인코딩"],
} satisfies ToolMeta
