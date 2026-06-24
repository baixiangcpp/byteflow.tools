import { FILE_INPUT_POLICIES, readArrayBufferWithPolicy } from "@/core/files/file-input-policy"
import { scanImageMetadata } from "./logic"
import type { ImageMetadataScan } from "./types"

export type StripImageMetadataResult = {
    blob: Blob
    before: ImageMetadataScan
    after: ImageMetadataScan
    width: number
    height: number
}

export function createLocalObjectUrl(blob: Blob): string {
    return URL.createObjectURL(blob)
}

export function revokeLocalObjectUrl(url: string) {
    URL.revokeObjectURL(url)
}

export function downloadObjectUrl(url: string, filename: string) {
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
}

export async function stripImageMetadata(file: File, outputType: "image/png" | "image/jpeg" = "image/png"): Promise<StripImageMetadataResult> {
    if (!file.type.startsWith("image/")) throw new Error("Choose a PNG or JPEG image.")
    const beforeBytes = new Uint8Array(await readArrayBufferWithPolicy(file, FILE_INPUT_POLICIES["scan-image"]))
    const before = scanImageMetadata(beforeBytes, file.type)
    const objectUrl = createLocalObjectUrl(file)
    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const nextImage = new Image()
            nextImage.onload = () => resolve(nextImage)
            nextImage.onerror = () => reject(new Error("Image could not be decoded by the browser."))
            nextImage.src = objectUrl
        })
        const canvas = document.createElement("canvas")
        canvas.width = image.naturalWidth || image.width
        canvas.height = image.naturalHeight || image.height
        const context = canvas.getContext("2d")
        if (!context) throw new Error("Canvas is unavailable.")
        context.drawImage(image, 0, 0)
        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((nextBlob) => {
                if (!nextBlob) reject(new Error("Browser failed to export sanitized image."))
                else resolve(nextBlob)
            }, outputType, 0.92)
        })
        const after = scanImageMetadata(new Uint8Array(await blob.arrayBuffer()), outputType)
        return { blob, before, after, width: canvas.width, height: canvas.height }
    } finally {
        revokeLocalObjectUrl(objectUrl)
    }
}
