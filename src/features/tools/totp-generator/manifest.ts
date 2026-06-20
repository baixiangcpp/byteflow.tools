import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "totp_generator",
    slug: "totp-generator",
    category: "generators",
    relatedTools: ["password_generator", "hash_generator", "uuid_generator", "id_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["totp generator", "hotp generator", "2fa code", "authenticator code generator"],
    persistInput: false,
} satisfies ToolMeta
