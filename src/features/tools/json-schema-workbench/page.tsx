"use client"

import * as React from "react"
import { Copy, Eraser, FileJson2, Play, RotateCcw, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { generateJsonSchema, validateJsonWithSchema, formatValidationReport } from "./logic"
import { SAMPLE_INPUT, SAMPLE_SCHEMA } from "./samples"

type Mode = "generate" | "validate"

export function JsonSchemaWorkbenchPage() {
    const { t } = useLang()
    const toolT = t.tools["json_schema_workbench"] as Record<string, string>
    const [mode, setMode] = React.useState<Mode>("generate")
    const [payload, setPayload] = React.useState(SAMPLE_INPUT)
    const [schema, setSchema] = React.useState(SAMPLE_SCHEMA)
    const [output, setOutput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)

    const run = React.useCallback(() => {
        try {
            const nextOutput = mode === "generate"
                ? generateJsonSchema(payload)
                : formatValidationReport(validateJsonWithSchema(payload, schema))
            setOutput(nextOutput)
            setError(null)
        } catch (runError) {
            setOutput("")
            setError(runError instanceof Error ? runError.message : String(runError))
        }
    }, [mode, payload, schema])

    const copyOutput = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, { description: t.common.copied_desc })
    }

    const loadSample = () => {
        setPayload(SAMPLE_INPUT)
        setSchema(SAMPLE_SCHEMA)
        setOutput("")
        setError(null)
    }

    const clear = () => {
        setPayload("")
        setSchema("")
        setOutput("")
        setError(null)
    }

    const actions: ToolAction[] = [
        { id: "run", label: mode === "generate" ? toolT.generate_action : toolT.validate_action, icon: Play, onClick: run, variant: "default", disabled: !payload.trim() },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void copyOutput(), disabled: !output },
        { id: "sample", label: t.common.sample, icon: RotateCcw, onClick: loadSample },
        { id: "clear", label: t.common.clear, icon: Eraser, onClick: clear },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <FileJson2 className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{toolT.description}</p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <SensitiveInputWarning variant="default" />

            <div className="flex flex-wrap gap-2" role="group" aria-label={toolT.mode_label}>
                {(["generate", "validate"] as const).map((item) => (
                    <button
                        key={item}
                        type="button"
                        className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"}`}
                        onClick={() => {
                            setMode(item)
                            setOutput("")
                            setError(null)
                        }}
                    >
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        {item === "generate" ? toolT.mode_generate : toolT.mode_validate}
                    </button>
                ))}
            </div>

            {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}

            <div className="grid flex-1 gap-4 xl:grid-cols-3">
                <section className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{toolT.payload_label}</div>
                    <Textarea className="h-full min-h-[360px] resize-none border-0 p-4 font-mono text-xs leading-5" value={payload} onChange={(event) => setPayload(event.target.value)} spellCheck={false} />
                </section>
                <section className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{toolT.schema_label}</div>
                    <Textarea className="h-full min-h-[360px] resize-none border-0 p-4 font-mono text-xs leading-5" value={schema} onChange={(event) => setSchema(event.target.value)} readOnly={mode === "generate"} spellCheck={false} />
                </section>
                <section className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{t.common.output}</div>
                    <Textarea className="h-full min-h-[360px] resize-none border-0 bg-muted/30 p-4 font-mono text-xs leading-5" value={output} readOnly spellCheck={false} />
                </section>
            </div>

            <RelatedTools toolKey="json_schema_workbench" />
        </div>
    )
}

