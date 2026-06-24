import { runCompressionLab } from "./utils"
import type { CompressionTaskInput } from "./compression-task"

type WorkerPostMessage = (message: unknown) => void

const postWorkerMessage = self.postMessage.bind(self) as WorkerPostMessage

self.onmessage = (event: MessageEvent<CompressionTaskInput>) => {
    const task = event.data
    void runCompressionLab(task.input, task)
        .then((result) => {
            postWorkerMessage({ ok: true, value: result })
        })
        .catch((error) => {
            postWorkerMessage({
                ok: false,
                error: error instanceof Error ? error.message : "COMPRESSION_TASK_FAILED",
            })
        })
}

export {}
