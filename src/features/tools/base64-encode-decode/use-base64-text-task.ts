"use client"

import * as React from "react"
import { runBase64TextTask } from "./base64-task"
import type { Operation } from "./types"

type RunTextTaskOptions = {
    input: string
    operation: Operation
    urlSafe: boolean
    onSuccess: (output: string) => void
    onError: () => void
}

export function useBase64TextTask() {
    const [isProcessing, setIsProcessing] = React.useState(false)
    const taskRequestIdRef = React.useRef(0)
    const taskAbortControllerRef = React.useRef<AbortController | null>(null)

    React.useEffect(() => () => {
        taskAbortControllerRef.current?.abort()
    }, [])

    const runTextTask = React.useCallback(async ({
        input,
        operation,
        urlSafe,
        onSuccess,
        onError,
    }: RunTextTaskOptions) => {
        const requestId = taskRequestIdRef.current + 1
        taskRequestIdRef.current = requestId
        taskAbortControllerRef.current?.abort()
        const controller = new AbortController()
        taskAbortControllerRef.current = controller
        setIsProcessing(true)

        try {
            const result = await runBase64TextTask({ input, operation, urlSafe }, { signal: controller.signal })
            if (taskRequestIdRef.current !== requestId) return
            onSuccess(result.output)
        } catch {
            if (taskRequestIdRef.current === requestId) {
                onError()
            }
        } finally {
            if (taskRequestIdRef.current === requestId) {
                taskAbortControllerRef.current = null
                setIsProcessing(false)
            }
        }
    }, [])

    return { isProcessing, runTextTask }
}
