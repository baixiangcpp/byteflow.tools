"use client"

import * as React from "react"
import { readArrayBufferWithPolicy, type FileInputPolicy } from "@/core/files/file-input-policy"
import { runBase64FileTask } from "./base64-task"

type EncodeFileTaskOptions = {
    file: File
    filePolicy: FileInputPolicy
    onSuccess: (output: string) => void
    onError: () => void
}

type DecodeFileTaskOptions = {
    input: string
    onSuccess: (bytes: ArrayBuffer) => void
    onError: () => void
}

export function useBase64FileTask() {
    const [isFileProcessing, setIsFileProcessing] = React.useState(false)
    const fileTaskRequestIdRef = React.useRef(0)
    const fileTaskAbortControllerRef = React.useRef<AbortController | null>(null)

    const abortFileTask = React.useCallback(() => {
        fileTaskRequestIdRef.current += 1
        fileTaskAbortControllerRef.current?.abort()
        fileTaskAbortControllerRef.current = null
        setIsFileProcessing(false)
    }, [])

    React.useEffect(() => () => {
        abortFileTask()
    }, [abortFileTask])

    const runEncodeFileTask = React.useCallback(async ({
        file,
        filePolicy,
        onSuccess,
        onError,
    }: EncodeFileTaskOptions) => {
        const requestId = fileTaskRequestIdRef.current + 1
        fileTaskRequestIdRef.current = requestId
        fileTaskAbortControllerRef.current?.abort()
        const controller = new AbortController()
        fileTaskAbortControllerRef.current = controller
        setIsFileProcessing(true)

        try {
            const buffer = await readArrayBufferWithPolicy(file, filePolicy)
            if (fileTaskRequestIdRef.current !== requestId) return
            const result = await runBase64FileTask({
                task: "file",
                operation: "encode",
                bytes: buffer,
                urlSafe: false,
            }, { signal: controller.signal })
            if (fileTaskRequestIdRef.current !== requestId) return
            onSuccess(result.operation === "encode" ? result.output : "")
        } catch {
            if (fileTaskRequestIdRef.current === requestId) onError()
        } finally {
            if (fileTaskRequestIdRef.current === requestId) {
                fileTaskAbortControllerRef.current = null
                setIsFileProcessing(false)
            }
        }
    }, [])

    const runDecodeFileTask = React.useCallback(async ({
        input,
        onSuccess,
        onError,
    }: DecodeFileTaskOptions) => {
        const requestId = fileTaskRequestIdRef.current + 1
        fileTaskRequestIdRef.current = requestId
        fileTaskAbortControllerRef.current?.abort()
        const controller = new AbortController()
        fileTaskAbortControllerRef.current = controller
        setIsFileProcessing(true)

        try {
            const result = await runBase64FileTask({
                task: "file",
                operation: "decode",
                input,
                urlSafe: false,
            }, { signal: controller.signal })
            if (fileTaskRequestIdRef.current !== requestId) return
            onSuccess(result.operation === "decode" ? result.bytes : new ArrayBuffer(0))
        } catch {
            if (fileTaskRequestIdRef.current === requestId) onError()
        } finally {
            if (fileTaskRequestIdRef.current === requestId) {
                fileTaskAbortControllerRef.current = null
                setIsFileProcessing(false)
            }
        }
    }, [])

    return { abortFileTask, isFileProcessing, runDecodeFileTask, runEncodeFileTask }
}
