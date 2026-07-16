"use client"

import * as React from "react"
import { Eraser, Sparkles, TestTube2, Copy, Download, Play, Workflow } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { removeExtraWhitespace } from "@/core/utils/whitespace-utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildToolHandoffLink } from "@/core/routing/tool-handoff"
import { WideToolPageContainer } from "@/components/layout/page-container"

export function MultipleWhitespaceRemoverPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["multiple_whitespace_remover"] as Record<string, string>
    const text = (key: string) => toolT[key]
    const sampleText = text("sample_text")

    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")

    const inputSize = new Blob([input]).size
    const outputSize = new Blob([output]).size
    const savedPercent = inputSize > 0 && output
        ? ((1 - outputSize / inputSize) * 100).toFixed(1)
        : "0.0"

    const handleClean = () => {
        if (!input.trim()) {
            setOutput("")
            return
        }
        setOutput(removeExtraWhitespace(input))
    }

    const handleSample = () => {
        setInput(sampleText)
        setOutput("")
    }

    const handleClear = () => {
        setInput("")
        setOutput("")
    }

    const handleCopy = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: t.common.copied_desc,
        })
    }

    const handleDownload = () => {
        if (!output) return

        const blob = new Blob([output], { type: "text/plain;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "text.cleaned.txt"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handoffPayload = output || input
    const pipelineHandoff = React.useMemo(
        () => buildToolHandoffLink(lang, "pipeline-builder", handoffPayload),
        [handoffPayload, lang],
    )

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: t.common.sample,
            icon: TestTube2,
            onClick: handleSample,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
        },
        {
            id: "download",
            label: t.common.download,
            icon: Download,
            onClick: handleDownload,
            disabled: !output,
        },
        {
            id: "clean",
            label: text("clean_action"),
            icon: Play,
            onClick: handleClean,
            variant: "default",
        },
        {
            id: "to_pipeline_builder",
            label: (t.tools["pipeline_builder"] as Record<string, string> | undefined)?.title ?? "Pipeline Builder",
            icon: Workflow,
            href: pipelineHandoff.href,
            onClick: pipelineHandoff.prime,
            disabled: !handoffPayload.trim(),
        },
    ]

    return (
        <WideToolPageContainer className="flex h-full flex-col space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Sparkles className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {text("description")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {output ? (
                        <div className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                            {text("size_summary")
                                .replace("{input}", String(inputSize))
                                .replace("{output}", String(outputSize))
                                .replace("{saved}", savedPercent)}
                        </div>
                    ) : null}
                    <ToolActionBar actions={actions} handoffPayload={handoffPayload} />
                </div>
            </div>

            <div className="grid min-h-[500px] flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.input}</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[400px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            placeholder={text("input_placeholder")}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            spellCheck={false}
                        />
                    </div>
                </div>

                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} disabled={!output}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">{t.common.copy_output}</span>
                        </Button>
                    </div>
                    <div className="relative flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[400px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            placeholder={t.common.result_placeholder}
                            value={output}
                            readOnly
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </WideToolPageContainer>
    )
}
