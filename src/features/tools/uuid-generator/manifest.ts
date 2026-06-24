import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "uuid_generator",
    slug: "uuid-generator",
    category: "generators",
    relatedTools: ["password_generator", "unix_timestamp", "lorem_ipsum", "id_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    relatedWorkflows: [
        { toolKey: "password_generator", reasonKey: "generate_test_credentials" },
        { toolKey: "unix_timestamp", reasonKey: "stamp_seed_data" },
        { toolKey: "lorem_ipsum", reasonKey: "fill_fixture_records" },
    ],
    keywords: ["uuid generator", "uuid v4 generator", "generate uuid online", "guid generator"],
    searchKeywords: ["generate uuid", "unique id", "guid", "random uuid", "UUID生成", "UUID 생성", "UUID作成", "唯一标识符"],
} satisfies ToolMeta
