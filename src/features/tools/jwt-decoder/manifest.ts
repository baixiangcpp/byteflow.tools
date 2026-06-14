import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "jwt_decoder",
    slug: "jwt-decoder",
    category: "text-string",
    relatedTools: ["jwt_workbench", "base64_encode_decode", "hash_generator", "url_encode_decode"],
    keywords: ["jwt decoder", "decode jwt online", "jwt parser", "json web token decoder"],
    searchKeywords: ["decode token", "parse jwt", "jwt inspector", "token decoder", "令牌解码", "トークンデコード", "JWT 파서", "解析令牌"],
} satisfies ToolMeta
