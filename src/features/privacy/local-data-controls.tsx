"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearByteflowLocalData } from "@/core/storage/tool-persistence-policy"

export function LocalDataControls() {
    const [message, setMessage] = React.useState<string | null>(null)

    const clearData = () => {
        const removed = clearByteflowLocalData()
        setMessage(removed > 0 ? `Cleared ${removed} saved Byteflow item${removed === 1 ? "" : "s"}.` : "No saved Byteflow data was found.")
    }

    return (
        <div className="rounded-2xl border border-border/70 bg-background/55 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Local data controls</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Byteflow processing stays in your browser. Some preferences and non-sensitive tool settings may be saved locally;
                        sensitive payloads are configured not to persist by default.
                    </p>
                </div>
                <Button type="button" variant="outline" onClick={clearData}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear saved tool data
                </Button>
            </div>
            {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </div>
    )
}
