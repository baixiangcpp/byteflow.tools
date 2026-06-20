"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"
import { clearByteflowLocalData } from "@/core/storage/tool-persistence-policy"

export function LocalDataControls() {
    const { t } = useLang()
    const [message, setMessage] = React.useState<string | null>(null)
    const labels = t.common.local_data_controls

    const clearData = () => {
        const removed = clearByteflowLocalData()
        if (removed === 0) {
            setMessage(requireTranslationValue(labels.none_found_message, "common.local_data_controls.none_found_message"))
            return
        }

        const messageTemplate = removed === 1
            ? requireTranslationValue(labels.cleared_one_message, "common.local_data_controls.cleared_one_message")
            : requireTranslationValue(labels.cleared_many_message, "common.local_data_controls.cleared_many_message")

        setMessage(messageTemplate.replace("{count}", String(removed)))
    }

    return (
        <div className="rounded-2xl border border-border/70 bg-background/55 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">
                        {requireTranslationValue(labels.title, "common.local_data_controls.title")}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {requireTranslationValue(labels.description, "common.local_data_controls.description")}
                    </p>
                </div>
                <Button type="button" variant="outline" onClick={clearData}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {requireTranslationValue(labels.clear_button, "common.local_data_controls.clear_button")}
                </Button>
            </div>
            {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </div>
    )
}
