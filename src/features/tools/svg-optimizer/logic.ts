import DOMPurify from "isomorphic-dompurify"

export function optimizeSvg(svg: string): string {
    let result = svg
    result = result.replace(/<\?xml[^?]*\?>\s*/gi, "")
    result = result.replace(/<!--[\s\S]*?-->/g, "")
    result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
    result = result.replace(/<title[\s\S]*?<\/title>/gi, "")
    result = result.replace(/<desc[\s\S]*?<\/desc>/gi, "")
    result = result.replace(/\s+(inkscape|sodipodi|xmlns:inkscape|xmlns:sodipodi|xmlns:rdf|xmlns:cc|xmlns:dc)[^=]*="[^"]*"/gi, "")
    result = result.replace(/<g[^>]*>\s*<\/g>/gi, "")
    result = result.replace(/\s{2,}/g, " ")
    result = result.replace(/>\s+</g, "><")
    result = result.replace(/\s+>/g, ">")
    result = result.replace(/\s+\/>/g, "/>")
    return result.trim()
}

export function sanitizeSvg(svg: string): string {
    return DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ["script", "foreignObject", "iframe", "object", "embed"],
        FORBID_ATTR: ["onload", "onclick", "onerror", "onmouseover", "onfocus", "onbegin", "onend"],
    }).trim()
}

export function optimizeAndSanitizeSvg(svg: string): string {
    return sanitizeSvg(optimizeSvg(svg))
}
