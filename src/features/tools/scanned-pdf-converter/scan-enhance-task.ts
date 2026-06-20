import { runWorkerTask } from "@/core/workers/run-worker-task"
import { enhanceScanDataUrlDom } from "./scan-enhance-dom"
import type { ScanEnhanceTaskInput, ScanEnhanceTaskResult } from "./scan-enhance-task-types"

export type ScanEnhanceRenderResult = {
    dataUrl: string
    width: number
    height: number
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(reader.error || new Error("SCAN_ENHANCE_DATA_URL_FAILED"))
        reader.onload = () => resolve(String(reader.result || ""))
        reader.readAsDataURL(blob)
    })
}

async function enhanceWithWorker(input: ScanEnhanceTaskInput): Promise<ScanEnhanceRenderResult> {
    const result = await runWorkerTask<ScanEnhanceTaskInput, ScanEnhanceTaskResult>(
        () => new Worker(new URL("./scan-enhance-worker.ts", import.meta.url), { type: "module" }),
        input,
        { timeoutMs: 20_000 },
    )

    return {
        dataUrl: await blobToDataUrl(new Blob([result.bytes], { type: result.mime })),
        width: result.width,
        height: result.height,
    }
}

export async function runScanEnhanceTask(input: ScanEnhanceTaskInput): Promise<ScanEnhanceRenderResult> {
    if (
        typeof Worker === "undefined" ||
        typeof OffscreenCanvas === "undefined" ||
        typeof createImageBitmap !== "function"
    ) {
        return enhanceScanDataUrlDom(input)
    }

    try {
        return await enhanceWithWorker(input)
    } catch (error) {
        if (error instanceof Error && error.message === "WORKER_TIMEOUT") {
            throw error
        }
        return enhanceScanDataUrlDom(input)
    }
}
