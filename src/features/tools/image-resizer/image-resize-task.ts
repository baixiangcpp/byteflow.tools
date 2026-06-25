import { runWorkerTask, WorkerTaskError } from "@/core/workers/run-worker-task"
import { renderImageResizeDataUrlDom } from "./image-resize-dom"
import type { ImageResizeTaskInput } from "./image-resize-task-types"

export type ImageResizeRenderResult = {
    dataUrl: string
    sourceWidth: number
    sourceHeight: number
    outputWidth: number
    outputHeight: number
}

type ImageResizeTaskOptions = {
    signal?: AbortSignal
    timeoutMs?: number
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(reader.error || new Error("IMAGE_RESIZE_DATA_URL_FAILED"))
        reader.onload = () => resolve(String(reader.result || ""))
        reader.readAsDataURL(blob)
    })
}

async function renderWithWorker(input: ImageResizeTaskInput, options: ImageResizeTaskOptions): Promise<ImageResizeRenderResult> {
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
        { signal: options.signal, timeoutMs: options.timeoutMs ?? 20_000, transfer: input.sourceBytes ? [input.sourceBytes] : undefined },
    )

    return {
        dataUrl: await blobToDataUrl(new Blob([result.bytes], { type: result.mime })),
        sourceWidth: result.sourceWidth,
        sourceHeight: result.sourceHeight,
        outputWidth: result.outputWidth,
        outputHeight: result.outputHeight,
    }
}

export async function runImageResizeTask(input: ImageResizeTaskInput, options: ImageResizeTaskOptions = {}): Promise<ImageResizeRenderResult> {
    if (
        typeof Worker === "undefined" ||
        typeof OffscreenCanvas === "undefined" ||
        typeof createImageBitmap !== "function"
    ) {
        return renderImageResizeDataUrlDom(input)
    }

    try {
        return await renderWithWorker(input, options)
    } catch (error) {
        if (error instanceof WorkerTaskError && (error.code === "WORKER_TIMEOUT" || error.code === "WORKER_ABORTED")) {
            throw error
        }
        return renderImageResizeDataUrlDom(input)
    }
}
