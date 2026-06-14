import type { ErrorCorrectionLevel } from "./types"

let qrCodePromise: Promise<typeof import("qrcode")> | null = null
let toastPromise: Promise<typeof import("sonner")["toast"]> | null = null

export async function loadQRCode() {
    qrCodePromise ??= import("qrcode")
    return qrCodePromise
}

export async function loadToast() {
    toastPromise ??= import("sonner").then((module) => module.toast)
    return toastPromise
}

export function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
}

export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}

export function injectLogoIntoSvg(svg: string, options: { dataUrl: string; size: number; logoScale: number }): string {
    const logoSize = Math.floor((options.size * options.logoScale) / 100)
    const x = (options.size - logoSize) / 2
    const y = (options.size - logoSize) / 2
    const padding = Math.max(4, Math.floor(logoSize * 0.12))
    const radius = Math.max(5, Math.floor(logoSize * 0.15))

    const overlay = [
        `<rect x="${x - padding}" y="${y - padding}" width="${logoSize + padding * 2}" height="${logoSize + padding * 2}" rx="${radius}" fill="rgba(255,255,255,0.94)" />`,
        `<image href="${options.dataUrl}" x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" />`,
    ].join("")

    return svg.replace("</svg>", `${overlay}</svg>`)
}

export function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ""))
        reader.readAsDataURL(file)
    })
}

export function downloadDataUrl(dataUrl: string, filename: string) {
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = filename
    a.click()
}

export async function buildQrSvg(options: {
    text: string
    size: number
    margin: number
    errorCorrectionLevel: ErrorCorrectionLevel
    fgColor: string
    bgColor: string
    logoDataUrl: string | null
    logoEnabled: boolean
    logoScale: number
}) {
    const qrCode = await loadQRCode()
    const svg = await qrCode.toString(options.text, {
        type: "svg",
        width: options.size,
        margin: options.margin,
        errorCorrectionLevel: options.errorCorrectionLevel,
        color: {
            dark: options.fgColor,
            light: options.bgColor,
        },
    })

    return options.logoEnabled && options.logoDataUrl
        ? injectLogoIntoSvg(svg, { dataUrl: options.logoDataUrl, size: options.size, logoScale: options.logoScale })
        : svg
}

export function downloadSvg(svg: string, filename: string) {
    const blob = new Blob([svg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
