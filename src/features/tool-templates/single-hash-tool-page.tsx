"use client"

import * as React from "react"
import { Copy, Eraser, Fingerprint, Hash } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { hashTextByAlgorithm, type StandardHashAlgorithm } from "@/core/utils/hash-utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

type SingleHashToolPageProps = {
    algorithm: StandardHashAlgorithm
    title: string
    description: string
    outputLabel: string
    outputPlaceholder: string
    inputLabel?: string
    inputPlaceholder?: string
    openFullHashLabel?: string
    relatedToolKey?: string
}

export function SingleHashToolPage({
    algorithm,
    title,
    description,
    outputLabel,
    outputPlaceholder,
    inputLabel,
    inputPlaceholder,
    openFullHashLabel,
    relatedToolKey,
}: SingleHashToolPageProps) {
    const { t, lang } = useLang()
    const [input, setInput] = React.useState("")

    const digest = React.useMemo(
        () => hashTextByAlgorithm(input, algorithm),
        [algorithm, input],
    )

    const copyOutput = async () => {
        if (!digest) return
        const result = await safeClipboardWrite(digest)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const actions: ToolAction[] = [
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: () => setInput(""),
        },
        {
            id: "full_hash",
            label: openFullHashLabel ?? t.common.hash_tool.open_full_tool,
            icon: Hash,
            href: `/${lang}/hash-generator`,
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-5xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Fingerprint className="h-6 w-6 text-primary" />
                        {title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">{description}</p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium">{inputLabel ?? t.common.hash_tool.input}</label>
                    <Textarea
                        className="min-h-[280px] resize-none font-mono text-sm leading-relaxed"
                        placeholder={inputPlaceholder ?? t.common.hash_tool.type_or_paste}
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        spellCheck={false}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <label className="text-sm font-medium">{outputLabel}</label>
                            <div className="flex items-center gap-1.5 ml-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-bold tracking-wider text-emerald-600/90 dark:text-emerald-400/90 uppercase">
                                    {t.common.hash_tool.live}
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => void copyOutput()} disabled={!digest}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">{t.common.copy}</span>
                        </Button>
                    </div>
                    <Input
                        readOnly
                        value={digest}
                        className="bg-muted/50 font-mono text-sm"
                        placeholder={outputPlaceholder}
                    />
                </div>
            </div>

            {relatedToolKey ? <RelatedTools toolKey={relatedToolKey} source="inline" /> : null}
        </div>
    )
}
