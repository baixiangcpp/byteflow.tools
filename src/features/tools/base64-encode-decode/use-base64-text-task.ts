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

    const runTextTask = React.useCallback(async ({
        input,
        operation,
        urlSafe,
        onSuccess,
        onError,
    }: RunTextTaskOptions) => {
        const requestId = taskRequestIdRef.current + 1
        taskRequestIdRef.current = requestId
        setIsProcessing(true)

        try {
            const result = await runBase64TextTask({ input, operation, urlSafe })
            if (taskRequestIdRef.current !== requestId) return
            onSuccess(result.output)
        } catch {
            if (taskRequestIdRef.current === requestId) {
                onError()
            }
        } finally {
            if (taskRequestIdRef.current === requestId) {
                setIsProcessing(false)
            }
        }
    }, [])

    return { isProcessing, runTextTask }
}
