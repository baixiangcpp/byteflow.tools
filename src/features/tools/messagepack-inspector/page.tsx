"use client"

import * as React from "react"
import { Binary, Copy, Eraser, Play, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { decodeMessagePack } from "./logic"
import { SAMPLE_INPUT } from "./samples"
import type { MessagePackInputMode } from "./types"

export function MessagepackInspectorPage() {
    const { t } = useLang()
    const toolT = t.tools["messagepack_inspector"] as Record<string, string>
    const [mode, setMode] = React.useState<MessagePackInputMode>("hex")
    const [input, setInput] = React.useState(SAMPLE_INPUT)
    const [output, setOutput] = React.useState("")
    const [summary, setSummary] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)

    const run = React.useCallback(() => {
        try {
            const report = decodeMessagePack(input, mode)
            setOutput(report.json)
            setSummary(`${report.summary} ${toolT.bytes_label}: ${report.bytes}`)
            setError(null)
        } catch (runError) {
            setOutput("")
            setSummary("")
            setError(runError instanceof Error ? runError.message : String(runError))
        }
    }, [input, mode, toolT.bytes_label])

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
        { id: "run", label: toolT.decode_action, icon: Play, onClick: run, variant: "default", disabled: !input.trim() },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: copyOutput, disabled: !output },
        { id: "sample", label: t.common.sample, icon: RotateCcw, onClick: () => { setInput(SAMPLE_INPUT); setOutput(""); setSummary(""); setError(null) } },
        { id: "clear", label: t.common.clear, icon: Eraser, onClick: () => { setInput(""); setOutput(""); setSummary(""); setError(null) } },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Binary className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{toolT.description}</p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <SensitiveInputWarning variant="default" />

            <div className="flex flex-wrap gap-2" role="group" aria-label={toolT.mode_label}>
                {(["hex", "base64"] as const).map((item) => (
                    <button
                        key={item}
                        type="button"
                        className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"}`}
                        onClick={() => setMode(item)}
                    >
                        {item === "hex" ? toolT.mode_hex : toolT.mode_base64}
                    </button>
                ))}
            </div>

            {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
            {summary ? <div className="rounded-md border border-border/70 bg-card p-3 text-sm text-muted-foreground">{summary}</div> : null}

            <div className="grid flex-1 gap-4 lg:grid-cols-2">
                <section className="flex min-h-[440px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{t.common.input}</div>
                    <Textarea className="h-full min-h-[380px] resize-none border-0 p-4 font-mono text-xs leading-5" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} />
                </section>
                <section className="flex min-h-[440px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{t.common.output}</div>
                    <Textarea className="h-full min-h-[380px] resize-none border-0 bg-muted/30 p-4 font-mono text-xs leading-5" value={output} readOnly spellCheck={false} />
                </section>
            </div>

            <RelatedTools toolKey="messagepack_inspector" />
        </div>
    )
}

