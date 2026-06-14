"use client"

import * as React from "react"
import { Copy, Download, Eraser, PenLine, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { convertStrokeToFill } from "@/features/tools/svg-stroke-to-fill-converter/utils"

const SAMPLE_INPUT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <rect x="26" y="26" width="204" height="204" rx="28" stroke="#0f172a" stroke-width="12" fill="none" />
  <circle cx="128" cy="128" r="54" stroke="#38bdf8" stroke-width="16" fill="none" />
  <line x1="56" y1="200" x2="200" y2="200" stroke="#22d3ee" stroke-width="14" />
</svg>`

export function SvgStrokeToFillConverterPage() {
    const { t } = useLang()
    const toolT = t.tools["svg_stroke_to_fill_converter"] as Record<string, string>
    const pageTitle = toolT.title
    const [input, setInput] = React.useState(SAMPLE_INPUT)
    const [isClientReady, setIsClientReady] = React.useState(false)

    React.useEffect(() => {
        setIsClientReady(true)
    }, [])

    const result = React.useMemo(
        () => (isClientReady ? convertStrokeToFill(input) : { svg: input, converted: 0, fallback: 0 }),
        [input, isClientReady],
    )
    const output = result.svg
    const outputDataUri = React.useMemo(() => {
        if (result.error) return ""
        return `data:image/svg+xml;utf8,${encodeURIComponent(output)}`
    }, [output, result.error])

    const summary = React.useMemo(
        () =>
            [
                `${toolT.output_converted_label}: ${result.converted}`,
                `${toolT.output_fallback_label}: ${result.fallback}`,
                `${toolT.output_errors_label}: ${result.error ? result.error : t.common.none}`,
            ].join(" | "),
        [result.converted, result.error, result.fallback, t.common.none, toolT.output_converted_label, toolT.output_errors_label, toolT.output_fallback_label],
    )

    const handleSample = () => {
        setInput(SAMPLE_INPUT)
    }

    const handleReset = () => {
        setInput("")
    }

    const handleCopy = async () => {
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const handleDownload = () => {
        if (!output || result.error) return
        const blob = new Blob([output], { type: "image/svg+xml;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "stroke-to-fill.svg"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void handleCopy(), disabled: !output },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload, disabled: !output || Boolean(result.error) },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <PenLine className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.input_svg}</div>
                        <Textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            className="min-h-[360px] resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>

                    <div className="rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground">{summary}</div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header">
                        <span>{t.common.output}</span>
                    </div>
                    <ToolPreviewArea
                        title={t.common.preview}
                    >
                        {outputDataUri ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={outputDataUri} alt={pageTitle} className="max-h-[400px] w-auto rounded object-contain drop-shadow-md" />
                        ) : (
                            <div className="grid h-[180px] place-items-center text-xs text-muted-foreground italic">
                                {result.error || t.common.preview_unavailable}
                            </div>
                        )}
                    </ToolPreviewArea>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[260px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
