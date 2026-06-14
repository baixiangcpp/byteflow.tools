import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "base64_encode_decode",
    slug: "base64-encode-decode",
    category: "text-string",
    relatedTools: ["url_encode_decode", "jwt_decoder", "hash_generator", "image_base64"],
    keywords: ["base64 encode", "base64 decode", "base64 converter online"],
    searchKeywords: ["encode base64", "decode base64", "base64 decoder", "base64 encoder", "编码", "解码", "base64解码", "base64编码", "转码", "Base64デコード", "Base64エンコード", "Base64 디코딩", "Base64 인코딩"],
} satisfies ToolMeta
