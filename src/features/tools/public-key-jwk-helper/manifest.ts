import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "public_key_jwk_helper",
    slug: "public-key-jwk-helper",
    category: "network-web",
    relatedTools: ["oauth_jwks_workbench", "certificate_decoder", "jwt_verifier", "jwt_workbench", "asn1_der_inspector"],
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
        { toolKey: "certificate_decoder", reasonKey: "inspect_certificate_material" },
        { toolKey: "jwt_verifier", reasonKey: "verify_token_signatures" },
        { toolKey: "asn1_der_inspector", reasonKey: "inspect_der_structure" },
    ],
    sampleInput: "-----BEGIN PUBLIC KEY-----",
    sampleMode: "pem-to-jwk",
    inputSizePolicy: {
        warnAtBytes: 65536,
        hardLimitBytes: 262144,
        streamingSupported: false,
    },
    keywords: ["jwk to pem", "pem to jwk", "public key converter", "jwk thumbprint"],
    searchKeywords: ["public key", "jwk", "pem", "spki", "rsa public key", "ec public key", "key thumbprint"],
    persistInput: false,
} satisfies ToolMeta
