import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "oauth_jwks_workbench",
    slug: "oauth-jwks-workbench",
    category: "text-string",
    relatedTools: ["jwt_decoder", "jwt_workbench", "jwt_verifier", "public_key_jwk_helper"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    sampleInput: "{\"keys\":[{\"kty\":\"RSA\",\"kid\":\"sample\",\"alg\":\"RS256\",\"use\":\"sig\"}]}",
    sampleMode: "inspect-jwks",
    keywords: ["oauth pkce generator", "jwks verifier", "jwks inspector", "jwt jwks verification"],
    searchKeywords: ["oauth", "pkce", "jwks", "jwk", "kid", "jwt verify"],
    persistInput: false,
    networkAccess: "none",
} satisfies ToolMeta
