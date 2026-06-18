import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "jwt_verifier",
    slug: "jwt-verifier",
    category: "text-string",
    relatedTools: ["jwt_workbench", "jwt_decoder", "hash_generator", "base64_encode_decode", "certificate_decoder"],
    keywords: ["jwt verify", "jwt signature verifier", "hmac jwt verify", "jwt validator online"],
    persistInput: false,
} satisfies ToolMeta
