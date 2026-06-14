export type StrokeToFillResult = {
    svg: string
    converted: number
    fallback: number
    error?: string
}

function parseNumber(value: string | null, fallback: number): number {
    if (!value) return fallback
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

function copyCommonAttributes(source: Element, target: Element) {
    const attrs = ["transform", "opacity", "fill-rule", "clip-path", "class", "style"]
    for (const name of attrs) {
        const value = source.getAttribute(name)
        if (value) target.setAttribute(name, value)
    }
}

function createRectRingPath(x: number, y: number, w: number, h: number, strokeWidth: number): string {
    const s = strokeWidth / 2
    const ox = x - s
    const oy = y - s
    const ow = w + strokeWidth
    const oh = h + strokeWidth
    const ix = x + s
    const iy = y + s
    const iw = Math.max(0, w - strokeWidth)
    const ih = Math.max(0, h - strokeWidth)

    return [
        `M ${ox} ${oy} H ${ox + ow} V ${oy + oh} H ${ox} Z`,
        `M ${ix} ${iy} H ${ix + iw} V ${iy + ih} H ${ix} Z`,
    ].join(" ")
}

function createCircleRingPath(cx: number, cy: number, r: number, strokeWidth: number): string {
    const outer = Math.max(0, r + strokeWidth / 2)
    const inner = Math.max(0, r - strokeWidth / 2)
    return [
        `M ${cx - outer} ${cy}`,
        `a ${outer} ${outer} 0 1 0 ${outer * 2} 0`,
        `a ${outer} ${outer} 0 1 0 ${-outer * 2} 0`,
        `M ${cx - inner} ${cy}`,
        `a ${inner} ${inner} 0 1 1 ${inner * 2} 0`,
        `a ${inner} ${inner} 0 1 1 ${-inner * 2} 0`,
    ].join(" ")
}

function createEllipseRingPath(cx: number, cy: number, rx: number, ry: number, strokeWidth: number): string {
    const outerX = Math.max(0, rx + strokeWidth / 2)
    const outerY = Math.max(0, ry + strokeWidth / 2)
    const innerX = Math.max(0, rx - strokeWidth / 2)
    const innerY = Math.max(0, ry - strokeWidth / 2)
    return [
        `M ${cx - outerX} ${cy}`,
        `a ${outerX} ${outerY} 0 1 0 ${outerX * 2} 0`,
        `a ${outerX} ${outerY} 0 1 0 ${-outerX * 2} 0`,
        `M ${cx - innerX} ${cy}`,
        `a ${innerX} ${innerY} 0 1 1 ${innerX * 2} 0`,
        `a ${innerX} ${innerY} 0 1 1 ${-innerX * 2} 0`,
    ].join(" ")
}

function lineToPolygonPoints(x1: number, y1: number, x2: number, y2: number, strokeWidth: number): string {
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy)
    if (len <= 0.0001) {
        const r = strokeWidth / 2
        return `${x1 - r},${y1 - r} ${x1 + r},${y1 - r} ${x1 + r},${y1 + r} ${x1 - r},${y1 + r}`
    }
    const px = (-dy / len) * (strokeWidth / 2)
    const py = (dx / len) * (strokeWidth / 2)
    const a = `${x1 + px},${y1 + py}`
    const b = `${x2 + px},${y2 + py}`
    const c = `${x2 - px},${y2 - py}`
    const d = `${x1 - px},${y1 - py}`
    return `${a} ${b} ${c} ${d}`
}

export function convertStrokeToFill(svgText: string): StrokeToFillResult {
    const parser = new DOMParser()
    const xml = parser.parseFromString(svgText, "image/svg+xml")
    if (xml.querySelector("parsererror")) {
        return { svg: svgText, converted: 0, fallback: 0, error: "Invalid SVG input." }
    }

    const svg = xml.documentElement
    let converted = 0
    let fallback = 0

    const candidates = Array.from(svg.querySelectorAll("[stroke]"))
    for (const node of candidates) {
        const stroke = node.getAttribute("stroke")
        if (!stroke || stroke === "none" || stroke === "transparent") continue
        const strokeWidth = Math.max(0, parseNumber(node.getAttribute("stroke-width"), 1))
        if (strokeWidth <= 0) continue

        if (node.tagName === "line") {
            const x1 = parseNumber(node.getAttribute("x1"), 0)
            const y1 = parseNumber(node.getAttribute("y1"), 0)
            const x2 = parseNumber(node.getAttribute("x2"), 0)
            const y2 = parseNumber(node.getAttribute("y2"), 0)
            const polygon = xml.createElement("polygon")
            polygon.setAttribute("points", lineToPolygonPoints(x1, y1, x2, y2, strokeWidth))
            polygon.setAttribute("fill", stroke)
            copyCommonAttributes(node, polygon)
            node.replaceWith(polygon)
            converted += 1
            continue
        }

        if (node.tagName === "rect") {
            const x = parseNumber(node.getAttribute("x"), 0)
            const y = parseNumber(node.getAttribute("y"), 0)
            const w = parseNumber(node.getAttribute("width"), 0)
            const h = parseNumber(node.getAttribute("height"), 0)
            const path = xml.createElement("path")
            path.setAttribute("d", createRectRingPath(x, y, w, h, strokeWidth))
            path.setAttribute("fill", stroke)
            path.setAttribute("fill-rule", "evenodd")
            copyCommonAttributes(node, path)
            node.replaceWith(path)
            converted += 1
            continue
        }

        if (node.tagName === "circle") {
            const cx = parseNumber(node.getAttribute("cx"), 0)
            const cy = parseNumber(node.getAttribute("cy"), 0)
            const r = Math.max(0, parseNumber(node.getAttribute("r"), 0))
            const path = xml.createElement("path")
            path.setAttribute("d", createCircleRingPath(cx, cy, r, strokeWidth))
            path.setAttribute("fill", stroke)
            path.setAttribute("fill-rule", "evenodd")
            copyCommonAttributes(node, path)
            node.replaceWith(path)
            converted += 1
            continue
        }

        if (node.tagName === "ellipse") {
            const cx = parseNumber(node.getAttribute("cx"), 0)
            const cy = parseNumber(node.getAttribute("cy"), 0)
            const rx = Math.max(0, parseNumber(node.getAttribute("rx"), 0))
            const ry = Math.max(0, parseNumber(node.getAttribute("ry"), 0))
            const path = xml.createElement("path")
            path.setAttribute("d", createEllipseRingPath(cx, cy, rx, ry, strokeWidth))
            path.setAttribute("fill", stroke)
            path.setAttribute("fill-rule", "evenodd")
            copyCommonAttributes(node, path)
            node.replaceWith(path)
            converted += 1
            continue
        }

        node.setAttribute("fill", stroke)
        node.setAttribute("stroke", "none")
        node.removeAttribute("stroke-width")
        fallback += 1
    }

    const serializer = new XMLSerializer()
    const out = serializer.serializeToString(xml)
    return { svg: out, converted, fallback }
}
