import { loadImageElement } from "@/core/utils/image-canvas-utils"
import { applyThresholdToRgba, buildScanFilterString } from "./utils"
import type { ScanEnhanceTaskInput } from "./scan-enhance-task-types"

export async function enhanceScanDataUrlDom({ source, enhance }: ScanEnhanceTaskInput): Promise<{
    dataUrl: string
    width: number
    height: number
}> {
    const image = await loadImageElement(source)
    const canvas = document.createElement("canvas")
    canvas.width = image.width
    canvas.height = image.height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas context unavailable")

    context.filter = buildScanFilterString(enhance)
    context.drawImage(image, 0, 0, image.width, image.height)
    context.filter = "none"

    if (enhance.thresholdEnabled) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const thresholded = applyThresholdToRgba(imageData.data, enhance.threshold)
        imageData.data.set(thresholded)
        context.putImageData(imageData, 0, 0)
    }

    return {
        dataUrl: canvas.toDataURL("image/jpeg", 0.92),
        width: image.width,
        height: image.height,
    }
}
