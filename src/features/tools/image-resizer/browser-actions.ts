import { loadImageElement, validateImageDimensions } from "@/core/utils/image-canvas-utils"
import { FILE_INPUT_POLICIES, readArrayBufferWithPolicy } from "@/core/files/file-input-policy"

export type LoadedResizeImageFile = {
    bytes: ArrayBuffer
    height: number
    mime: string
    name: string
    objectUrl: string
    width: number
}

export async function loadResizeImageFile(file: File): Promise<LoadedResizeImageFile> {
    const bytes = await readArrayBufferWithPolicy(file, FILE_INPUT_POLICIES["image-standard"])
    const objectUrl = URL.createObjectURL(file)
    try {
        const image = await loadImageElement(objectUrl)
        validateImageDimensions(image.width, image.height, FILE_INPUT_POLICIES["image-standard"])
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
