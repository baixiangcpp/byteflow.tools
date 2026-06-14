import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "password_generator",
    slug: "password-generator",
    category: "generators",
    relatedTools: ["hash_generator", "uuid_generator", "lorem_ipsum"],
    keywords: ["password generator", "random password", "strong password generator online"],
} satisfies ToolMeta
