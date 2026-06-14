export type BlobConfig = {
    size: number
    points: number
    randomness: number
    seed: number
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
}

function createSeededRandom(seed: number): () => number {
    let state = Math.floor(clamp(seed, 1, 2147483646))
    return () => {
        state = (state * 16807) % 2147483647
        return (state - 1) / 2147483646
    }
}

export function buildBlobPath(config: BlobConfig): string {
    const size = Math.round(clamp(config.size, 64, 1024))
    const pointCount = Math.round(clamp(config.points, 3, 20))
    const randomness = clamp(config.randomness, 0, 100) / 100
    const random = createSeededRandom(config.seed || 1)

    const center = size / 2
    const baseRadius = size * 0.36
    const points: Array<{ x: number; y: number }> = []

    for (let i = 0; i < pointCount; i += 1) {
        const angle = (Math.PI * 2 * i) / pointCount
        const jitter = (random() * 2 - 1) * randomness * baseRadius * 0.4
        const radius = clamp(baseRadius + jitter, size * 0.16, size * 0.48)
        points.push({
            x: center + Math.cos(angle) * radius,
            y: center + Math.sin(angle) * radius,
        })
    }

    const first = points[0]
    let path = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`

    for (let i = 0; i < points.length; i += 1) {
        const current = points[i]
        const next = points[(i + 1) % points.length]
        const mx = (current.x + next.x) / 2
        const my = (current.y + next.y) / 2
        path += ` Q ${current.x.toFixed(2)} ${current.y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`
    }

    return `${path} Z`
}

export function buildBlobSvg(path: string, size: number, fill: string, stroke: string): string {
    const safeSize = Math.round(clamp(size, 64, 1024))
    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${safeSize} ${safeSize}" width="${safeSize}" height="${safeSize}" role="img" aria-label="SVG blob">`,
        `  <path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`,
        "</svg>",
    ].join("\n")
}
