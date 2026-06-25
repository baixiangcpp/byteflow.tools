"use client"

import * as React from "react"
import { Copy, Download, Eraser, Play, RotateCcw, SearchCheck } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { downloadText } from "./browser-actions"
import { runSeoWorkbench } from "./logic"
import { SAMPLE_INPUT } from "./samples"

export function SeoMetadataWorkbenchPage() {
    const { t } = useLang()
    const toolT = t.tools["seo_metadata_workbench"] as Record<string, string>
    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)

    const run = React.useCallback(() => {
        try {
            setOutput(runSeoWorkbench(input))
            setError(null)
        } catch (runError) {
            setOutput("")
            setError(runError instanceof Error ? runError.message : String(runError))
        }
    }, [input])

    const copyOutput = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const actions: ToolAction[] = [
        { id: "run", label: toolT.analyze_action, icon: Play, onClick: run, variant: "default", disabled: !input.trim() },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void copyOutput(), disabled: !output },
        { id: "download", label: t.common.download, icon: Download, onClick: () => downloadText("seo-metadata-report.txt", output), disabled: !output },
        { id: "sample", label: t.common.sample, icon: RotateCcw, onClick: () => { setInput(SAMPLE_INPUT); setOutput(""); setError(null) } },
        { id: "clear", label: t.common.clear, icon: Eraser, onClick: () => { setInput(""); setOutput(""); setError(null) } },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <SearchCheck className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{toolT.description}</p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <SensitiveInputWarning />

            {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}

            <div className="grid flex-1 gap-4 lg:grid-cols-2">
                <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{toolT.config_label}</div>
                    <Textarea className="h-full min-h-[460px] resize-none border-0 p-4 font-mono text-xs leading-5" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} />
                </section>
                <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{toolT.report_label}</div>
                    <Textarea className="h-full min-h-[460px] resize-none border-0 bg-muted/30 p-4 font-mono text-xs leading-5" value={output} readOnly spellCheck={false} />
                </section>
            </div>

            <RelatedTools toolKey="seo_metadata_workbench" />
        </div>
    )
}
