"use client"

import * as React from "react"
import { emptyHmacHashes, emptyStandardHashes } from "@/core/utils/hash-utils"
import { runHashTask } from "./hash-task"
import type { HashBatchRow, HashTaskInput } from "./hash-task-logic"

export function useHashTask(input: HashTaskInput | null) {
    const [standardHashes, setStandardHashes] = React.useState(emptyStandardHashes)
    const [hmacHashes, setHmacHashes] = React.useState(emptyHmacHashes)
    const [batchRows, setBatchRows] = React.useState<HashBatchRow[]>([])
    const [isHashing, setIsHashing] = React.useState(false)
    const taskRequestIdRef = React.useRef(0)
    const taskAbortControllerRef = React.useRef<AbortController | null>(null)

    React.useEffect(() => {
        const requestId = taskRequestIdRef.current + 1
        taskRequestIdRef.current = requestId
        taskAbortControllerRef.current?.abort()

        if (!input) {
            taskAbortControllerRef.current = null
            setStandardHashes(emptyStandardHashes())
            setHmacHashes(emptyHmacHashes())
            setBatchRows([])
            setIsHashing(false)
            return
        }

        const controller = new AbortController()
        taskAbortControllerRef.current = controller
        setIsHashing(true)
        void runHashTask(input, { signal: controller.signal })
            .then((result) => {
                if (taskRequestIdRef.current !== requestId) return
                setStandardHashes(result.standardHashes)
                setHmacHashes(result.hmacHashes)
                setBatchRows(result.batchRows)
            })
            .catch(() => {
                if (taskRequestIdRef.current !== requestId) return
                setStandardHashes(emptyStandardHashes())
                setHmacHashes(emptyHmacHashes())
                setBatchRows([])
            })
            .finally(() => {
                if (taskRequestIdRef.current === requestId) {
                    taskAbortControllerRef.current = null
                    setIsHashing(false)
                }
            })

        return () => {
            controller.abort()
        }
    }, [input])

    return { standardHashes, hmacHashes, batchRows, isHashing }
}
