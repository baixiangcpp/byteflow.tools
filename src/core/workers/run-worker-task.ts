export type WorkerTaskOptions = {
    timeoutMs?: number
}

export function runWorkerTask<TInput, TOutput>(
    createWorker: () => Worker,
    input: TInput,
    options: WorkerTaskOptions = {},
): Promise<TOutput> {
    const timeoutMs = options.timeoutMs ?? 15_000

    return new Promise((resolve, reject) => {
        let settled = false
        const worker = createWorker()
        const timeoutId = window.setTimeout(() => {
            finish(() => reject(new Error("WORKER_TIMEOUT")))
        }, timeoutMs)

        const finish = (complete: () => void) => {
            if (settled) return
            settled = true
            window.clearTimeout(timeoutId)
            worker.terminate()
            complete()
        }

        worker.onmessage = (event: MessageEvent<{ ok: true; value: TOutput } | { ok: false; error: string }>) => {
            const message = event.data
            if (message.ok) {
                finish(() => resolve(message.value))
                return
            }
            finish(() => reject(new Error(message.error)))
        }

        worker.onerror = (event) => {
            finish(() => reject(event.error instanceof Error ? event.error : new Error(event.message)))
        }

        worker.postMessage(input)
    })
}
