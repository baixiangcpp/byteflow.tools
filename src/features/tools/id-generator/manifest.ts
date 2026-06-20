import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "id_generator",
    slug: "id-generator",
    category: "generators",
    relatedTools: ["uuid_generator", "password_generator", "unix_timestamp", "hash_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["uuid v7 generator", "ulid generator", "nanoid generator", "unique id generator online"],
} satisfies ToolMeta
