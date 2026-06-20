import { sanitizeSvgForPreview } from "@/core/security/sanitize"

export type SvgDimensions = {
    width: number
    height: number
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
}

export function normalizeRasterDimension(value: number, fallback: number): number {
    const n = Math.round(value)
    if (!Number.isFinite(n) || n <= 0) return fallback
    return clamp(n, 32, 4096)
}

function parseLength(value: string | null): number | null {
    if (!value) return null
    const match = value.trim().match(/^(-?\d+(\.\d+)?)/)
    if (!match) return null
    const n = Number(match[1])
    return Number.isFinite(n) && n > 0 ? n : null
}

export function extractSvgDimensions(svg: string): SvgDimensions {
    const widthAttr = svg.match(/\bwidth\s*=\s*["']([^"']+)["']/i)?.[1] ?? null
    const heightAttr = svg.match(/\bheight\s*=\s*["']([^"']+)["']/i)?.[1] ?? null
    const parsedWidth = parseLength(widthAttr)
    const parsedHeight = parseLength(heightAttr)

    if (parsedWidth && parsedHeight) {
        return {
            width: normalizeRasterDimension(parsedWidth, 512),
            height: normalizeRasterDimension(parsedHeight, 512),
        }
    }

    const viewBox = svg.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1]
    if (viewBox) {
        const parts = viewBox
            .trim()
            .split(/[,\s]+/)
            .map((part) => Number(part))
            .filter((n) => Number.isFinite(n))
        if (parts.length === 4) {
            const w = Math.abs(parts[2])
            const h = Math.abs(parts[3])
            if (w > 0 && h > 0) {
                return {
                    width: normalizeRasterDimension(w, 512),
                    height: normalizeRasterDimension(h, 512),
                }
            }
        }
    }

    return { width: 512, height: 512 }
}

export function ensureSvgMarkup(input: string): string {
    const value = input.trim()
    if (!value.toLowerCase().includes("<svg")) {
        throw new Error("Input does not contain an <svg> root element.")
    }
    return sanitizeSvgForPreview(value)
}

export async function rasterizeSvgToPngDataUrl({
    svg,
    width,
    height,
    background,
}: {
    svg: string
    width: number
    height: number
    background: string | null
}): Promise<string> {
    const safeSvg = ensureSvgMarkup(svg)
    const targetWidth = normalizeRasterDimension(width, 512)
    const targetHeight = normalizeRasterDimension(height, 512)

    const blob = new Blob([safeSvg], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image()
            el.onload = () => resolve(el)
            el.onerror = () => reject(new Error("Failed to load SVG image"))
            el.src = url
        })

        const canvas = document.createElement("canvas")
        canvas.width = targetWidth
        canvas.height = targetHeight
        const context = canvas.getContext("2d")
        if (!context) throw new Error("Canvas 2D context unavailable")

        if (background) {
            context.fillStyle = background
            context.fillRect(0, 0, targetWidth, targetHeight)
        } else {
            context.clearRect(0, 0, targetWidth, targetHeight)
        }

        context.drawImage(image, 0, 0, targetWidth, targetHeight)
        return canvas.toDataURL("image/png")
    } finally {
        URL.revokeObjectURL(url)
    }
}
