import { loadImageElement } from "@/core/utils/image-canvas-utils"

export type LoadedScanImageFile = {
    bytes: ArrayBuffer
    height: number
    mime: string
    name: string
    objectUrl: string
    width: number
}

export async function loadScanImageFile(file: File): Promise<LoadedScanImageFile> {
    const bytes = await file.arrayBuffer()
    const objectUrl = URL.createObjectURL(file)
    try {
        const image = await loadImageElement(objectUrl)
        return {
            bytes,
            height: image.height,
            mime: file.type,
            name: file.name,
            objectUrl,
            width: image.width,
        }
    } catch (error) {
        URL.revokeObjectURL(objectUrl)
        throw error
    }
}

export function downloadPdfBytes(bytes: Uint8Array, filename: string) {
    const safeBuffer = Uint8Array.from(bytes).buffer as ArrayBuffer
    const blob = new Blob([safeBuffer], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}
