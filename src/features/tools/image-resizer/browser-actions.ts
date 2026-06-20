import { loadImageElement } from "@/core/utils/image-canvas-utils"

export type LoadedResizeImageFile = {
    bytes: ArrayBuffer
    height: number
    mime: string
    name: string
    objectUrl: string
    width: number
}

export async function loadResizeImageFile(file: File): Promise<LoadedResizeImageFile> {
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

export function replaceObjectUrl(ref: { current: string | null }, nextUrl: string | null) {
    if (ref.current) {
        URL.revokeObjectURL(ref.current)
    }
    ref.current = nextUrl
}
