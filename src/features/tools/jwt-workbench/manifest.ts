import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "jwt_workbench",
    slug: "jwt-workbench",
    category: "text-string",
    relatedTools: ["jwt_decoder", "jwt_verifier", "oauth_jwks_workbench", "public_key_jwk_helper"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["jwt workbench", "jwt encode decode verify", "jwt hs256 signer", "jwt all in one tool"],
    persistInput: false,
} satisfies ToolMeta
