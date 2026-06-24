"use client"

import * as React from "react"
import { Copy, Download, Eraser, GitCompareArrows, Play, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { downloadText } from "./browser-actions"
import { diffOpenApiSpecs, formatOpenApiDiffReport } from "./logic"
import { SAMPLE_AFTER, SAMPLE_BEFORE } from "./samples"

export function OpenapiDiffPage() {
    const { t } = useLang()
    const toolT = t.tools["openapi_diff"] as Record<string, string>
    const [before, setBefore] = React.useState(SAMPLE_BEFORE)
    const [after, setAfter] = React.useState(SAMPLE_AFTER)
    const [output, setOutput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)

    const run = React.useCallback(() => {
        try {
            setOutput(formatOpenApiDiffReport(diffOpenApiSpecs(before, after)))
            setError(null)
        } catch (runError) {
            setOutput("")
            setError(runError instanceof Error ? runError.message : String(runError))
        }
    }, [after, before])

    const copyOutput = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const loadSample = () => {
        setBefore(SAMPLE_BEFORE)
        setAfter(SAMPLE_AFTER)
        setOutput("")
        setError(null)
    }

    const clear = () => {
        setBefore("")
        setAfter("")
        setOutput("")
        setError(null)
    }

    const actions: ToolAction[] = [
        { id: "run", label: toolT.compare_action, icon: Play, onClick: run, variant: "default", disabled: !before.trim() || !after.trim() },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void copyOutput(), disabled: !output },
        { id: "download", label: t.common.download, icon: Download, onClick: () => downloadText("openapi-diff-report.txt", output), disabled: !output },
        { id: "sample", label: t.common.sample, icon: RotateCcw, onClick: loadSample },
        { id: "clear", label: t.common.clear, icon: Eraser, onClick: clear },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <GitCompareArrows className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{toolT.description}</p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <SensitiveInputWarning variant="request" />
            {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{toolT.before_label}</div>
                    <Textarea className="h-full min-h-[360px] resize-none border-0 p-4 font-mono text-xs leading-5" value={before} onChange={(event) => setBefore(event.target.value)} spellCheck={false} />
                </section>
                <section className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{toolT.after_label}</div>
                    <Textarea className="h-full min-h-[360px] resize-none border-0 p-4 font-mono text-xs leading-5" value={after} onChange={(event) => setAfter(event.target.value)} spellCheck={false} />
                </section>
            </div>

            <section className="flex min-h-[260px] flex-col overflow-hidden rounded-lg border bg-card">
                <div className="tool-pane-header">{toolT.report_label}</div>
                <Textarea className="h-full min-h-[220px] resize-none border-0 bg-muted/30 p-4 font-mono text-xs leading-5" value={output} readOnly spellCheck={false} />
            </section>

            <RelatedTools toolKey="openapi_diff" />
        </div>
    )
}
