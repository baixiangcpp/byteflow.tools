"use client"

import * as React from "react"
import { readArrayBufferWithPolicy, validateFileAgainstPolicy, type FileInputPolicy } from "@/core/files/file-input-policy"

type UseHashFileInputOptions = {
    filePolicy: FileInputPolicy
    tooLargeMessage: string
}

export function useHashFileInput({ filePolicy, tooLargeMessage }: UseHashFileInputOptions) {
    const [fileName, setFileName] = React.useState("")
    const [fileSize, setFileSize] = React.useState(0)
    const [fileError, setFileError] = React.useState<string | null>(null)
    const [fileBytes, setFileBytes] = React.useState<Uint8Array | null>(null)
    const [isReadingFile, setIsReadingFile] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const fileReadRequestIdRef = React.useRef(0)

    const clearFileState = React.useCallback(() => {
        fileReadRequestIdRef.current += 1
        setFileName("")
        setFileSize(0)
        setFileBytes(null)
        setFileError(null)
        setIsReadingFile(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }, [])

    const handleFileSelect = React.useCallback(async (file: File | null) => {
        if (!file) return
        const requestId = fileReadRequestIdRef.current + 1
        fileReadRequestIdRef.current = requestId
        const validation = validateFileAgainstPolicy(file, filePolicy)
        if (!validation.ok) {
            setFileBytes(null)
            setFileName("")
            setFileSize(0)
            setIsReadingFile(false)
            setFileError(validation.reason === "too_large" ? tooLargeMessage : validation.message)
            return
        }

        setIsReadingFile(true)
        try {
            const buffer = await readArrayBufferWithPolicy(file, filePolicy)
            if (fileReadRequestIdRef.current !== requestId) return
            setFileBytes(new Uint8Array(buffer))
            setFileName(file.name)
            setFileSize(file.size)
            setFileError(null)
        } catch {
            if (fileReadRequestIdRef.current !== requestId) return
            setFileBytes(null)
            setFileName("")
            setFileSize(0)
            setFileError(tooLargeMessage)
        } finally {
            if (fileReadRequestIdRef.current === requestId) {
                setIsReadingFile(false)
            }
        }
    }, [filePolicy, tooLargeMessage])

    return {
        clearFileState,
        fileBytes,
        fileError,
        fileInputRef,
        fileName,
        fileSize,
        handleFileSelect,
        isReadingFile,
    }
}
