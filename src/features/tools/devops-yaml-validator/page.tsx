"use client"

import * as React from "react"
import { Copy, Eraser, FileCode2, Play, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { formatDevopsYamlReport, validateDevopsYaml } from "./logic"
import { SAMPLE_INPUT } from "./samples"

export function DevopsYamlValidatorPage() {
    const { t } = useLang()
    const toolT = t.tools["devops_yaml_validator"] as Record<string, string>
    const [input, setInput] = React.useState(SAMPLE_INPUT)
    const [output, setOutput] = React.useState("")

    const run = React.useCallback(() => {
        setOutput(formatDevopsYamlReport(validateDevopsYaml(input)))
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
        { id: "run", label: toolT.validate_action, icon: Play, onClick: run, variant: "default", disabled: !input.trim() },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: copyOutput, disabled: !output },
        { id: "sample", label: t.common.sample, icon: RotateCcw, onClick: () => { setInput(SAMPLE_INPUT); setOutput("") } },
        { id: "clear", label: t.common.clear, icon: Eraser, onClick: () => { setInput(""); setOutput("") } },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <FileCode2 className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{toolT.description}</p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <SensitiveInputWarning variant="log" />

            <div className="grid flex-1 gap-4 lg:grid-cols-2">
                <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{toolT.yaml_label}</div>
                    <Textarea className="h-full min-h-[460px] resize-none border-0 p-4 font-mono text-xs leading-5" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} />
                </section>
                <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{toolT.report_label}</div>
                    <Textarea className="h-full min-h-[460px] resize-none border-0 bg-muted/30 p-4 font-mono text-xs leading-5" value={output} readOnly spellCheck={false} />
                </section>
            </div>

            <RelatedTools toolKey="devops_yaml_validator" />
        </div>
    )
}

