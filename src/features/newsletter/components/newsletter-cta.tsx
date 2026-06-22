"use client"

import * as React from "react"
import { Sparkles, X } from "lucide-react"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"
import { openExternalUrl } from "@/core/security/external-url"
import { readStorageString, writeStorageString } from "@/core/storage/tool-persistence"

const STORAGE_KEY = "byteflow_newsletter_dismissed"

export function NewsletterCTA() {
    const [visible, setVisible] = React.useState(false)
    const { t } = useLang()

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (readStorageString(STORAGE_KEY)) return
        const timer = setTimeout(() => {
            setVisible(true)
        }, 15000)
        return () => clearTimeout(timer)
    }, [])

    const handleDismiss = () => {
        setVisible(false)
        writeStorageString(STORAGE_KEY, "1")
    }

    const handleClick = () => {
        openExternalUrl("https://github.com/baixiangcpp/byteflow.tools")
        setVisible(false)
        writeStorageString(STORAGE_KEY, "1")
    }

    if (!visible) return null

    return (
        <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in duration-500">
            <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                    <Sparkles aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{t.common.cta_newsletter_title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.common.cta_newsletter_desc}</p>
                    <button
                        onClick={handleClick}
                        className="mt-2 inline-flex min-h-9 items-center rounded-lg border border-primary/25 bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                    >
                        {t.common.cta_newsletter_button}
                    </button>
                </div>
                <button
                    onClick={handleDismiss}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                    aria-label={requireTranslationValue(t.common.close, "common.close")}
                >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    )
}
