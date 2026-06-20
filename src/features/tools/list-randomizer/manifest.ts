import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "list_randomizer",
    slug: "list-randomizer",
    category: "generators",
    relatedTools: ["fake_iban_generator", "id_generator", "lorem_ipsum", "password_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["list randomizer", "shuffle list online", "random sample picker", "seeded random list"],
} satisfies ToolMeta
