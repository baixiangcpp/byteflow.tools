import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "password_generator",
    slug: "password-generator",
    category: "generators",
    relatedTools: ["hash_generator", "uuid_generator", "lorem_ipsum"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["password generator", "random password", "strong password generator online"],
    persistInput: false,
} satisfies ToolMeta
