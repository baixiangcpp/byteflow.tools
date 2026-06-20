import type { ResizeFitMode, ResizeFormat } from "./utils"

export type ImageResizeTaskInput = {
    source: string
    targetWidth: number
    targetHeight: number
    fitMode: ResizeFitMode
    format: ResizeFormat
    quality: number
}

export type ImageResizeTaskResult = {
    mime: string
    bytes: ArrayBuffer
    sourceWidth: number
    sourceHeight: number
    outputWidth: number
    outputHeight: number
}
