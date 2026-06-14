import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "md5_generator",
    slug: "md5-generator",
    category: "text-string",
    relatedTools: ["hash_generator", "base64_encode_decode", "text_diff_checker", "password_generator"],
    keywords: ["md5 generator", "md5 hash online", "md5 checksum", "md5 encoder"],
} satisfies ToolMeta
