import { runWorkerTask } from "@/core/workers/run-worker-task"
import { renderImageResizeDataUrlDom } from "./image-resize-dom"
import type { ImageResizeTaskInput } from "./image-resize-task-types"

export type ImageResizeRenderResult = {
    dataUrl: string
    sourceWidth: number
    sourceHeight: number
    outputWidth: number
    outputHeight: number
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(reader.error || new Error("IMAGE_RESIZE_DATA_URL_FAILED"))
        reader.onload = () => resolve(String(reader.result || ""))
        reader.readAsDataURL(blob)
    })
}

async function renderWithWorker(input: ImageResizeTaskInput): Promise<ImageResizeRenderResult> {
    const result = await runWorkerTask<ImageResizeTaskInput, {
        mime: string
        bytes: ArrayBuffer
        sourceWidth: number
        sourceHeight: number
        outputWidth: number
        outputHeight: number
    }>(
        () => new Worker(new URL("./image-resize-worker.ts", import.meta.url), { type: "module" }),
        input,
        { timeoutMs: 20_000 },
    )

    return {
        dataUrl: await blobToDataUrl(new Blob([result.bytes], { type: result.mime })),
        sourceWidth: result.sourceWidth,
        sourceHeight: result.sourceHeight,
        outputWidth: result.outputWidth,
        outputHeight: result.outputHeight,
    }
}

export async function runImageResizeTask(input: ImageResizeTaskInput): Promise<ImageResizeRenderResult> {
    if (
        typeof Worker === "undefined" ||
        typeof OffscreenCanvas === "undefined" ||
        typeof createImageBitmap !== "function"
    ) {
        return renderImageResizeDataUrlDom(input)
    }

    try {
        return await renderWithWorker(input)
    } catch (error) {
        if (error instanceof Error && error.message === "WORKER_TIMEOUT") {
            throw error
        }
        return renderImageResizeDataUrlDom(input)
    }
}
