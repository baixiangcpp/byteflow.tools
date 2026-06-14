"use client"

import * as React from "react"
import { Code2, Eraser, ArrowRight, ArrowLeft, TestTube2, Copy, Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { encodeHtmlEntities, decodeHtmlEntities } from "@/features/tools/html-encoder-decoder/utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

const SAMPLE_HTML = "<div class=\"hero\">Alpha & Beta \"quoted\" <tag></div>"

export function HtmlEncoderDecoderPage() {
    const { t } = useLang()
    const toolT = t.tools["html_encoder_decoder"] as Record<string, string>
    const text = (key: string) => toolT[key]

    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")

    const encodeHtml = () => {
        if (!input) {
            setOutput("")
            return
        }
        setOutput(encodeHtmlEntities(input))
    }

    const decodeHtml = () => {
        if (!input) {
            setOutput("")
            return
        }
        setOutput(decodeHtmlEntities(input))
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
        anchor.download = "html-entities.txt"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleClear = () => {
        setInput("")
        setOutput("")
    }

    const handleSample = () => {
        setInput(SAMPLE_HTML)
        setOutput("")
    }

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
            id: "decode",
            label: text("decode_action"),
            icon: ArrowLeft,
            onClick: decodeHtml,
        },
        {
            id: "encode",
            label: text("encode_action"),
            icon: ArrowRight,
            onClick: encodeHtml,
            variant: "default",
        },
        {
            id: "download",
            label: t.common.download,
            icon: Download,
            onClick: handleDownload,
            disabled: !output,
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Code2 className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {text("description")}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
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
        </div>
    )
}
