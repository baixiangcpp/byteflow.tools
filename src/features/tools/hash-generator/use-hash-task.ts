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

    React.useEffect(() => {
        const requestId = taskRequestIdRef.current + 1
        taskRequestIdRef.current = requestId

        if (!input) {
            setStandardHashes(emptyStandardHashes())
            setHmacHashes(emptyHmacHashes())
            setBatchRows([])
            setIsHashing(false)
            return
        }

        setIsHashing(true)
        void runHashTask(input)
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
                    setIsHashing(false)
                }
            })
    }, [input])

    return { standardHashes, hmacHashes, batchRows, isHashing }
}
