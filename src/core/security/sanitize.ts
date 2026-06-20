import DOMPurify from "isomorphic-dompurify"
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

const ACTIVE_HTML_TAGS = [
    "embed",
    "form",
    "iframe",
    "input",
    "object",
    "script",
    "textarea",
] as const

const ACTIVE_EVENT_ATTRIBUTES = [
    "onabort",
    "onbegin",
    "onblur",
    "onclick",
    "onend",
    "onerror",
    "onfocus",
    "onload",
    "onmouseover",
    "onrepeat",
    "onscroll",
    "onunload",
] as const

export const MARKDOWN_SANITIZE_SCHEMA: RehypeSanitizeOptions = {
    ...defaultSchema,
    clobberPrefix: "byteflow-md-",
    protocols: {
        ...defaultSchema.protocols,
        cite: ["http", "https"],
        href: ["http", "https", "mailto"],
        longDesc: ["http", "https"],
        src: ["http", "https"],
    },
    strip: [
        ...new Set([
            ...(defaultSchema.strip ?? []),
            ...ACTIVE_HTML_TAGS,
            ...ACTIVE_SVG_TAGS,
        ]),
    ],
    tagNames: (defaultSchema.tagNames ?? []).filter(
        (tagName) => ![...ACTIVE_HTML_TAGS, ...ACTIVE_SVG_TAGS].includes(tagName as (typeof ACTIVE_HTML_TAGS | typeof ACTIVE_SVG_TAGS)[number]),
    ),
}

export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: [...ACTIVE_HTML_TAGS, "svg", "math"],
        FORBID_ATTR: [...ACTIVE_EVENT_ATTRIBUTES, "style"],
    }).trim()
}

export function sanitizeSvg(svg: string): string {
    return DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: [...ACTIVE_SVG_TAGS],
        FORBID_ATTR: [...ACTIVE_EVENT_ATTRIBUTES, "href", "style", "xlink:href"],
    }).trim()
}

export function sanitizeSvgForPreview(svg: string): string {
    const sanitized = sanitizeSvg(svg)
    if (!sanitized.toLowerCase().includes("<svg")) {
        throw new Error("Input does not contain a safe <svg> root element.")
    }
    return sanitized
}
