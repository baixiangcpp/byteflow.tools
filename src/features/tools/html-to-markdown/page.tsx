"use client"

import * as React from "react"
import { ArrowRightLeft, Copy, Download, Eraser, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { convertHtmlToMarkdown } from "@/features/tools/html-to-markdown/utils"
import { WideToolPageContainer } from "@/components/layout/page-container"

const SAMPLE_HTML = `<article>
  <h1>release_2048</h1>
  <p><strong>id</strong>: asset_512</p>
  <ul>
    <li>locale: zh-CN</li>
    <li>hash: sha256</li>
  </ul>
  <p><a href="https://example.com/docs/release_2048">https://example.com/docs/release_2048</a></p>
</article>`

export function HtmlToMarkdownPage() {
    const { t } = useLang()
    const toolT = t.tools["html_to_markdown"] as Record<string, string>

    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")

    const handleConvert = () => {
        setOutput(convertHtmlToMarkdown(input))
    }

    const handleSample = () => {
        setInput(SAMPLE_HTML)
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

        toast.success(t.common.copied)
    }

    const handleDownload = () => {
        if (!output) return

        const blob = new Blob([output], { type: "text/markdown;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "converted.md"
        anchor.click()
        URL.revokeObjectURL(url)
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
            id: "convert",
            label: t.common.format,
            icon: ArrowRightLeft,
            onClick: handleConvert,
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
        <WideToolPageContainer className="flex h-full flex-col space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <ArrowRightLeft className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid min-h-[500px] flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.input} (HTML)</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[400px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            placeholder="<p>...</p>"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            spellCheck={false}
                        />
                    </div>
                </div>

                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output} (Markdown)</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void handleCopy()} disabled={!output}>
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
