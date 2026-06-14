export type PatternKind = "dots" | "grid" | "diagonal"

export type PatternConfig = {
    kind: PatternKind
    tileSize: number
    gap: number
    strokeWidth: number
    foreground: string
    background: string
    width: number
    height: number
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
}

export function buildPatternShape(config: PatternConfig): string {
    const size = clamp(Math.round(config.tileSize), 8, 256)
    const gap = clamp(Math.round(config.gap), 0, size - 2)
    const strokeWidth = clamp(config.strokeWidth, 0.5, 24)
    const halfGap = gap / 2
    const inner = Math.max(1, size - gap)

    if (config.kind === "grid") {
        return [
            `<path d="M 0 ${halfGap.toFixed(2)} H ${size}" stroke="${config.foreground}" stroke-width="${strokeWidth}" />`,
            `<path d="M ${halfGap.toFixed(2)} 0 V ${size}" stroke="${config.foreground}" stroke-width="${strokeWidth}" />`,
        ].join("\n")
    }

    if (config.kind === "diagonal") {
        return `<path d="M ${-halfGap.toFixed(2)} ${size} L ${size} ${-halfGap.toFixed(2)}" stroke="${config.foreground}" stroke-width="${strokeWidth}" />`
    }

    const radius = clamp(inner * 0.2, 1, size * 0.45)
    return `<circle cx="${size / 2}" cy="${size / 2}" r="${radius.toFixed(2)}" fill="${config.foreground}" />`
}

export function buildPatternSvg(config: PatternConfig): string {
    const width = clamp(Math.round(config.width), 64, 2048)
    const height = clamp(Math.round(config.height), 64, 2048)
    const size = clamp(Math.round(config.tileSize), 8, 256)
    const shape = buildPatternShape(config)

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="SVG pattern">`,
        "  <defs>",
        `    <pattern id="p" width="${size}" height="${size}" patternUnits="userSpaceOnUse">`,
        `      <rect width="${size}" height="${size}" fill="${config.background}" />`,
        shape.split("\n").map((line) => `      ${line}`).join("\n"),
        "    </pattern>",
        "  </defs>",
        `  <rect width="${width}" height="${height}" fill="url(#p)" />`,
        "</svg>",
    ].join("\n")
}

export function buildPatternCss(dataUri: string): string {
    return [
        ".pattern {",
        `  background-image: url("${dataUri}");`,
        "  background-repeat: repeat;",
        "}",
    ].join("\n")
}
