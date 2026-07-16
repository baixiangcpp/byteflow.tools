import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "barcode_generator",
    slug: "barcode-generator",
    inputBehavior: "empty-first",
    category: "generators",
    relatedTools: ["qr_code_generator", "id_generator", "fake_iban_generator", "list_randomizer"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["barcode generator", "code128 generator", "ean13 generator", "barcode png svg export"],
} satisfies ToolMeta
