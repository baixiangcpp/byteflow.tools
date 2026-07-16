import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "jwt_decoder",
    slug: "jwt-decoder",
    inputBehavior: "empty-first",
    category: "text-string",
    relatedTools: ["jwt_workbench", "oauth_jwks_workbench", "base64_encode_decode", "hash_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    relatedWorkflows: [
        { toolKey: "jwt_workbench", reasonKey: "verify_token_claims", handoffSupported: true },
        { toolKey: "base64_encode_decode", reasonKey: "inspect_token_segments", handoffSupported: true },
        { toolKey: "hash_generator", reasonKey: "compare_token_hashes", handoffSupported: true },
    ],
    keywords: ["jwt decoder", "decode jwt online", "jwt parser", "json web token decoder"],
    searchKeywords: ["decode token", "parse jwt", "jwt inspector", "token decoder", "令牌解码", "トークンデコード", "JWT 파서", "解析令牌"],
    persistInput: false,
} satisfies ToolMeta
