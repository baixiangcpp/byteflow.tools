import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "uuid_generator",
    slug: "uuid-generator",
    category: "generators",
    relatedTools: ["password_generator", "unix_timestamp", "lorem_ipsum"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["uuid generator", "uuid v4 generator", "generate uuid online", "guid generator"],
    searchKeywords: ["generate uuid", "unique id", "guid", "random uuid", "UUID生成", "UUID 생성", "UUID作成", "唯一标识符"],
} satisfies ToolMeta
