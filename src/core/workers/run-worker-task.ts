export type WorkerTaskOptions = {
    signal?: AbortSignal
    timeoutMs?: number
    transfer?: Transferable[]
}

type WorkerTaskErrorPayload = {
    code?: string
    message?: string
}

type WorkerTaskMessage<TOutput> =
    | { ok: true; value: TOutput }
    | { ok: false; error: string | WorkerTaskErrorPayload }

export class WorkerTaskError extends Error {
    code: string

    constructor(code: string, message = code) {
        super(message)
        this.name = "WorkerTaskError"
        this.code = code
    }
}

function normalizeWorkerTaskError(error: unknown, fallbackCode: string): WorkerTaskError {
    if (error instanceof WorkerTaskError) return error
    if (error instanceof Error) return new WorkerTaskError(fallbackCode, error.message)
    if (typeof error === "string") return new WorkerTaskError(error, error)
    if (error && typeof error === "object") {
        const payload = error as WorkerTaskErrorPayload
        const code = typeof payload.code === "string" && payload.code ? payload.code : fallbackCode
        const message = typeof payload.message === "string" && payload.message ? payload.message : code
        return new WorkerTaskError(code, message)
    }
    return new WorkerTaskError(fallbackCode)
}

export function runWorkerTask<TInput, TOutput>(
    createWorker: () => Worker,
    input: TInput,
    options: WorkerTaskOptions = {},
): Promise<TOutput> {
    const timeoutMs = options.timeoutMs ?? 15_000

    return new Promise((resolve, reject) => {
        let settled = false
        let worker: Worker | undefined

        const finish = (complete: () => void) => {
            if (settled) return
            settled = true
            window.clearTimeout(timeoutId)
            options.signal?.removeEventListener("abort", handleAbort)
            worker?.terminate()
            complete()
        }

        const rejectWith = (error: unknown, fallbackCode: string) => {
            finish(() => reject(normalizeWorkerTaskError(error, fallbackCode)))
        }

        const handleAbort = () => {
            rejectWith(new WorkerTaskError("WORKER_ABORTED"), "WORKER_ABORTED")
        }

        if (options.signal?.aborted) {
            reject(normalizeWorkerTaskError(new WorkerTaskError("WORKER_ABORTED"), "WORKER_ABORTED"))
            return
        }

        try {
            worker = createWorker()
        } catch (error) {
            reject(normalizeWorkerTaskError(error, "WORKER_CREATE_FAILED"))
            return
        }

        options.signal?.addEventListener("abort", handleAbort, { once: true })

        const timeoutId = window.setTimeout(() => {
            rejectWith(new WorkerTaskError("WORKER_TIMEOUT"), "WORKER_TIMEOUT")
        }, timeoutMs)

        worker.onmessage = (event: MessageEvent<WorkerTaskMessage<TOutput>>) => {
            const message = event.data
            if (message.ok) {
                finish(() => resolve(message.value))
                return
            }
            rejectWith(message.error, "WORKER_TASK_FAILED")
        }

        worker.onerror = (event) => {
            rejectWith(event.error instanceof Error ? event.error : event.message, "WORKER_RUNTIME_ERROR")
        }

        worker.onmessageerror = () => {
            rejectWith(new WorkerTaskError("WORKER_MESSAGE_ERROR"), "WORKER_MESSAGE_ERROR")
        }

        try {
            worker.postMessage(input, options.transfer ?? [])
        } catch (error) {
            rejectWith(error, "WORKER_POST_MESSAGE_FAILED")
        }
    })
}
