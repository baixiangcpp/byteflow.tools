import { optimizeSvg } from "./logic"
import type { SvgOptimizeTaskInput } from "./svg-optimize-task"

type WorkerPostMessage = (message: unknown) => void

const postWorkerMessage = self.postMessage.bind(self) as WorkerPostMessage

self.onmessage = (event: MessageEvent<SvgOptimizeTaskInput>) => {
    try {
        postWorkerMessage({ ok: true, value: { optimized: optimizeSvg(event.data.svg) } })
    } catch (error) {
        postWorkerMessage({
            ok: false,
            error: error instanceof Error ? error.message : "SVG_OPTIMIZE_TASK_FAILED",
        })
    }
}

export {}
