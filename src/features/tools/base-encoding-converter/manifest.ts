import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "base_encoding_converter",
    slug: "base-encoding-converter",
    category: "text-string",
    relatedTools: ["base64_encode_decode", "hex_bytes_workbench", "url_encode_decode", "hash_generator"],
    keywords: ["base32 encoder", "base32 decoder", "base58 encoder", "base58 decoder", "base encoding converter"],
    searchKeywords: ["base32", "base58", "bitcoin base58", "encoding converter", "base encode", "base decode", "编码", "解码"],
} satisfies ToolMeta
