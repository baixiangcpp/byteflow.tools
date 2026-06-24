import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "jwt_verifier",
    slug: "jwt-verifier",
    category: "text-string",
    relatedTools: ["jwt_workbench", "oauth_jwks_workbench", "jwt_decoder", "public_key_jwk_helper", "certificate_decoder"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["jwt verify", "jwt signature verifier", "hmac jwt verify", "jwt validator online"],
    persistInput: false,
} satisfies ToolMeta
