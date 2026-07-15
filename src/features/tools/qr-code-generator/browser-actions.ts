import type { ErrorCorrectionLevel } from "./types"
import { FILE_INPUT_POLICIES, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { fileToDataUrl } from "@/core/utils/image-canvas-utils"

const OBJECT_URL_REVOKE_DELAY_MS = 1_000

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
    return fileToDataUrl(file, FILE_INPUT_POLICIES["image-logo"])
}

export type QrDecoder = typeof import("jsqr")["default"]

export function createRetryableQrDecoderLoader(loader: () => Promise<QrDecoder>) {
    let pending: Promise<QrDecoder> | null = null

    return async () => {
        pending ??= loader()
        const active = pending
        try {
            return await active
        } catch (error) {
            if (pending === active) pending = null
            throw error
        }
    }
}

const loadQrDecoderFromChunk = createRetryableQrDecoderLoader(
    () => import("jsqr").then((module) => module.default),
)

export function loadQrDecoder() {
    return loadQrDecoderFromChunk()
}

export type QrDecodeResult =
    | { ok: true; payload: string; width: number; height: number }
    | {
        ok: false
        error:
            | "empty_file"
            | "too_large"
            | "unsupported_type"
            | "image_too_large"
            | "image_load_failed"
            | "canvas_unavailable"
            | "decoder_unavailable"
            | "no_qr"
    }

export function decodeQrImageData(
    imageData: Pick<ImageData, "data" | "width" | "height">,
    decoder: QrDecoder,
): QrDecodeResult {
    const decoded = decoder(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
    })
    if (!decoded?.data) return { ok: false, error: "no_qr" }
    return {
        ok: true,
        payload: decoded.data,
        width: imageData.width,
        height: imageData.height,
    }
}

export async function decodeQrImageFile(file: File, decoder?: QrDecoder): Promise<QrDecodeResult> {
    const policy = FILE_INPUT_POLICIES["qr-decode-image"]
    const validation = validateFileAgainstPolicy(file, policy)
    if (!validation.ok) {
        const error = validation.reason === "too_large"
            ? "too_large"
            : validation.reason === "empty"
                ? "empty_file"
                : "unsupported_type"
        return { ok: false, error }
    }

    let dataUrl: string
    try {
        dataUrl = await fileToDataUrl(file, policy)
    } catch {
        return { ok: false, error: "unsupported_type" }
    }

    let image: HTMLImageElement
    try {
        image = await loadImage(dataUrl)
    } catch {
        return { ok: false, error: "image_load_failed" }
    }

    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height
    if (width <= 0 || height <= 0) return { ok: false, error: "image_load_failed" }
    if (policy.maxPixels && width * height > policy.maxPixels) {
        return { ok: false, error: "image_too_large" }
    }

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return { ok: false, error: "canvas_unavailable" }

    let imageData: ImageData
    try {
        context.drawImage(image, 0, 0)
        imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    } catch {
        return { ok: false, error: "image_load_failed" }
    }

    let activeDecoder = decoder
    if (!activeDecoder) {
        try {
            activeDecoder = await loadQrDecoder()
        } catch {
            return { ok: false, error: "decoder_unavailable" }
        }
    }

    try {
        return decodeQrImageData(imageData, activeDecoder)
    } catch {
        return { ok: false, error: "decoder_unavailable" }
    }
}

export type DownloadResult =
    | { ok: true }
    | { ok: false; error: "empty_file" | "download_failed" }

export function downloadUrl(url: string, filename: string): DownloadResult {
    if (!url || !filename || !document.body) return { ok: false, error: "download_failed" }

    const anchor = document.createElement("a")
    try {
        anchor.href = url
        anchor.download = filename
        anchor.rel = "noopener"
        anchor.hidden = true
        document.body.appendChild(anchor)
        anchor.click()
        return { ok: true }
    } catch {
        return { ok: false, error: "download_failed" }
    } finally {
        anchor.remove()
    }
}

export function downloadBlob(blob: Blob, filename: string): DownloadResult {
    if (blob.size === 0) return { ok: false, error: "empty_file" }

    let url = ""
    try {
        url = URL.createObjectURL(blob)
        return downloadUrl(url, filename)
    } catch {
        return { ok: false, error: "download_failed" }
    } finally {
        if (url) {
            window.setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_REVOKE_DELAY_MS)
        }
    }
}

export async function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): Promise<DownloadResult> {
    if (typeof canvas.toBlob === "function") {
        try {
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
            if (blob?.size) return downloadBlob(blob, filename)
        } catch {
            // Use the local data URL fallback below.
        }
    }

    try {
        const dataUrl = canvas.toDataURL("image/png")
        return dataUrl ? downloadUrl(dataUrl, filename) : { ok: false, error: "empty_file" }
    } catch {
        return { ok: false, error: "download_failed" }
    }
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

export function downloadSvg(svg: string, filename: string): DownloadResult {
    const blob = new Blob([svg], { type: "image/svg+xml" })
    return downloadBlob(blob, filename)
}
