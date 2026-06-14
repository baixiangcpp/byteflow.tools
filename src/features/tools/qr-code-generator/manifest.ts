import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "qr_code_generator",
    slug: "qr-code-generator",
    category: "generators",
    relatedTools: ["uuid_generator", "password_generator", "url_encode_decode"],
    keywords: ["qr code generator", "generate qr code online", "qr code maker"],
} satisfies ToolMeta
