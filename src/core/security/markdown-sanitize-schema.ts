import { defaultSchema } from "rehype-sanitize"
import type { Options as RehypeSanitizeOptions } from "rehype-sanitize"

const ACTIVE_SVG_TAGS = [
    "animate",
    "animateMotion",
    "animateTransform",
    "foreignObject",
    "iframe",
    "image",
    "object",
    "script",
    "set",
    "use",
] as const

const MARKDOWN_FORBIDDEN_HTML_TAGS = [
    "embed",
    "form",
    "iframe",
    "object",
    "script",
    "textarea",
] as const

export const MARKDOWN_SANITIZE_SCHEMA: RehypeSanitizeOptions = {
    ...defaultSchema,
    clobberPrefix: "byteflow-md-",
    attributes: {
        ...defaultSchema.attributes,
        input: [
            ...((defaultSchema.attributes?.input ?? []) as NonNullable<RehypeSanitizeOptions["attributes"]>[string]),
            ["checked", true],
        ],
    },
    protocols: {
        ...defaultSchema.protocols,
        cite: ["http", "https"],
        href: ["http", "https", "mailto"],
        longDesc: ["http", "https"],
        src: ["data", "blob"],
    },
    strip: [
        ...new Set([
            ...(defaultSchema.strip ?? []),
            ...MARKDOWN_FORBIDDEN_HTML_TAGS,
            ...ACTIVE_SVG_TAGS,
        ]),
    ],
    tagNames: (defaultSchema.tagNames ?? []).filter(
        (tagName) => ![...MARKDOWN_FORBIDDEN_HTML_TAGS, ...ACTIVE_SVG_TAGS].includes(tagName as (typeof MARKDOWN_FORBIDDEN_HTML_TAGS | typeof ACTIVE_SVG_TAGS)[number]),
    ),
}
