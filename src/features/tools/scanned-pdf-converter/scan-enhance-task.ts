import { runWorkerTask, WorkerTaskError } from "@/core/workers/run-worker-task"
import { enhanceScanDataUrlDom } from "./scan-enhance-dom"
import type { ScanEnhanceTaskInput, ScanEnhanceTaskResult } from "./scan-enhance-task-types"
import { dataUrlToUint8Array } from "./utils"

export type ScanEnhanceRenderResult = {
    dataUrl: string
    bytes: ArrayBuffer
    width: number
    height: number
}

type ScanEnhanceTaskOptions = {
    signal?: AbortSignal
    timeoutMs?: number
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(reader.error || new Error("SCAN_ENHANCE_DATA_URL_FAILED"))
        reader.onload = () => resolve(String(reader.result || ""))
        reader.readAsDataURL(blob)
    })
}

async function enhanceWithWorker(input: ScanEnhanceTaskInput, options: ScanEnhanceTaskOptions): Promise<ScanEnhanceRenderResult> {
    const result = await runWorkerTask<ScanEnhanceTaskInput, ScanEnhanceTaskResult>(
        () => new Worker(new URL("./scan-enhance-worker.ts", import.meta.url), { type: "module" }),
        input,
        { signal: options.signal, timeoutMs: options.timeoutMs ?? 20_000, transfer: input.sourceBytes ? [input.sourceBytes] : undefined },
    )

    return {
        dataUrl: await blobToDataUrl(new Blob([result.bytes], { type: result.mime })),
        bytes: result.bytes,
        width: result.width,
        height: result.height,
    }
}

async function enhanceWithDom(input: ScanEnhanceTaskInput): Promise<ScanEnhanceRenderResult> {
    const result = await enhanceScanDataUrlDom(input)
    const bytes = dataUrlToUint8Array(result.dataUrl)
    return {
        ...result,
        bytes: Uint8Array.from(bytes).buffer as ArrayBuffer,
    }
}

export async function runScanEnhanceTask(input: ScanEnhanceTaskInput, options: ScanEnhanceTaskOptions = {}): Promise<ScanEnhanceRenderResult> {
    if (
        typeof Worker === "undefined" ||
        typeof OffscreenCanvas === "undefined" ||
        typeof createImageBitmap !== "function"
    ) {
        return enhanceWithDom(input)
    }

    try {
        return await enhanceWithWorker(input, options)
    } catch (error) {
        if (error instanceof WorkerTaskError && (error.code === "WORKER_TIMEOUT" || error.code === "WORKER_ABORTED")) {
            throw error
        }
        return enhanceWithDom(input)
    }
}
