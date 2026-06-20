import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "fake_iban_generator",
    slug: "fake-iban-generator",
    category: "generators",
    relatedTools: ["barcode_generator", "list_randomizer", "id_generator", "password_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["fake iban generator", "test iban data", "iban checksum generator", "dummy bank iban"],
} satisfies ToolMeta
