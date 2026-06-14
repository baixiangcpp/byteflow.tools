import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "hash_generator",
    slug: "hash-generator",
    category: "text-string",
    relatedTools: ["md5_generator", "base64_encode_decode", "jwt_decoder", "password_generator"],
    keywords: ["hash generator", "md5 hash", "sha256 hash online", "sha512 generator"],
    searchKeywords: ["generate hash", "checksum", "hash text", "crypto hash", "哈希生成", "ハッシュ生成", "해시 생성", "校验和"],
} satisfies ToolMeta
