import DOMPurify from "dompurify"

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

const MARKDOWN_FORBIDDEN_HTML_TAGS = ACTIVE_HTML_TAGS.filter((tagName) => tagName !== "input")

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

export function sanitizeHtml(html: string): string {
    const sanitized = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: [...ACTIVE_HTML_TAGS, "svg", "math"],
        FORBID_ATTR: [...ACTIVE_EVENT_ATTRIBUTES, "style"],
    })

    if (typeof document === "undefined") return sanitized.trim()

    const template = document.createElement("template")
    template.innerHTML = sanitized
    for (const image of Array.from(template.content.querySelectorAll("img"))) {
        const src = image.getAttribute("src") ?? ""
        if (!isSafeMarkdownImageSrc(src)) {
            image.removeAttribute("src")
        }
    }

    return template.innerHTML.trim()
}

export function sanitizeMarkdownHtml(html: string): string {
    const sanitized = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: [...MARKDOWN_FORBIDDEN_HTML_TAGS, "svg", "math"],
        FORBID_ATTR: [...ACTIVE_EVENT_ATTRIBUTES, "style"],
        ADD_ATTR: ["checked"],
    })

    if (typeof document === "undefined") return sanitized.trim()

    const template = document.createElement("template")
    template.innerHTML = sanitized

    for (const image of Array.from(template.content.querySelectorAll("img"))) {
        const src = image.getAttribute("src") ?? ""
        if (!isSafeMarkdownImageSrc(src)) {
            image.removeAttribute("src")
        }
    }

    for (const input of Array.from(template.content.querySelectorAll("input"))) {
        const type = input.getAttribute("type")?.toLowerCase()
        if (type !== "checkbox") {
            input.remove()
            continue
        }

        const checked = input.hasAttribute("checked")
        for (const attr of Array.from(input.attributes)) {
            input.removeAttribute(attr.name)
        }
        input.setAttribute("type", "checkbox")
        input.setAttribute("disabled", "")
        if (checked) {
            input.setAttribute("checked", "")
        }
    }

    return template.innerHTML.trim()
}

export function isSafeMarkdownImageSrc(src: string | undefined): boolean {
    const trimmedSrc = src?.trim() ?? ""
    if (trimmedSrc === "") return false
    if (trimmedSrc.startsWith("blob:")) return true
    return /^data:image\/(?:avif|gif|jpeg|jpg|png|webp);/i.test(trimmedSrc)
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
