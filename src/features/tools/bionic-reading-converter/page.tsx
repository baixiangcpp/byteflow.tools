"use client"

import * as React from "react"
import { Copy, Download, Eraser, Eye, TestTube2, Type } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { ToolPageContainer } from "@/components/layout/page-container"

type Segment = {
    text: string
    bold: boolean
}

function clampRatio(value: number): number {
    if (!Number.isFinite(value)) return 0.45
    return Math.max(0.2, Math.min(0.8, value))
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;")
}

function splitWordToken(token: string, ratio: number): Segment[] {
    const match = token.match(/^([^A-Za-z0-9]*)([A-Za-z0-9][A-Za-z0-9'-]*)([^A-Za-z0-9]*)$/)
    if (!match) return [{ text: token, bold: false }]

    const [, prefix, word, suffix] = match
    const focusLength = Math.max(1, Math.ceil(word.length * clampRatio(ratio)))
    const focus = word.slice(0, focusLength)
    const rest = word.slice(focusLength)

    const output: Segment[] = []
    if (prefix) output.push({ text: prefix, bold: false })
    output.push({ text: focus, bold: true })
    if (rest) output.push({ text: rest, bold: false })
    if (suffix) output.push({ text: suffix, bold: false })
    return output
}

function convertLines(input: string, ratio: number): Segment[][] {
    return input.split(/\r?\n/).map((line) => {
        if (!line) return [{ text: "", bold: false }]
        const tokens = line.split(/(\s+)/)
        return tokens.flatMap((token) => {
            if (!token) return []
            if (/^\s+$/.test(token)) return [{ text: token, bold: false }]
            return splitWordToken(token, ratio)
        })
    })
}

function toMarkdown(lines: Segment[][]): string {
    return lines
        .map((line) =>
            line
                .map((segment) => (segment.bold ? `**${segment.text}**` : segment.text))
                .join(""),
        )
        .join("\n")
}

function toHtml(lines: Segment[][]): string {
    return lines
        .map((line) =>
            line
                .map((segment) =>
                    segment.bold
                        ? `<strong>${escapeHtml(segment.text)}</strong>`
                        : escapeHtml(segment.text),
                )
                .join(""),
        )
        .map((line) => `<p>${line || "&nbsp;"}</p>`)
        .join("\n")
}

function downloadText(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}

export function BionicReadingConverterPage() {
    const { t } = useLang()
    const toolT = t.tools["bionic_reading_converter"] as Record<string, string>
    const [input, setInput] = React.useState(toolT.sample_text)
    const [ratio, setRatio] = React.useState(0.45)
    const [format, setFormat] = React.useState<"markdown" | "html">("markdown")

    const lines = React.useMemo(() => convertLines(input, ratio), [input, ratio])
    const markdownOutput = React.useMemo(() => toMarkdown(lines), [lines])
    const htmlOutput = React.useMemo(() => toHtml(lines), [lines])
    const output = format === "markdown" ? markdownOutput : htmlOutput

    const handleSample = () => {
        setInput(toolT.sample_text)
        setRatio(0.45)
        setFormat("markdown")
    }

    const handleClear = () => setInput("")

    const handleCopy = async () => {
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const handleDownload = () =>
        downloadText(output, format === "markdown" ? "bionic-reading.md" : "bionic-reading.html")

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "clear", label: t.common.clear, icon: Eraser, onClick: handleClear },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy, disabled: !output.trim() },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload, disabled: !output.trim() },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Type className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="rounded-lg border bg-card p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2 rounded-md border bg-background/70 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.focus_ratio_label}</div>
                        <input
                            type="range"
                            min={0.2}
                            max={0.8}
                            step={0.01}
                            value={ratio}
                            onChange={(event) => setRatio(clampRatio(Number(event.target.value)))}
                            className="w-full"
                        />
                        <div className="text-xs text-muted-foreground">{Math.round(ratio * 100)}%</div>
                    </label>
                    <div className="space-y-2 rounded-md border bg-background/70 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.output_format_label}</div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant={format === "markdown" ? "default" : "outline"} onClick={() => setFormat("markdown")}>
                                {toolT.markdown_label}
                            </Button>
                            <Button variant={format === "html" ? "default" : "outline"} onClick={() => setFormat("html")}>
                                {toolT.html_label}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.02fr_0.98fr]">
                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header">
                        <span>{t.common.input}</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            className="h-full min-h-[320px] w-full resize-none border-0 p-4 text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                            placeholder={toolT.input_placeholder}
                        />
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{format.toUpperCase()}</span>
                    </div>
                    <div className="border-b bg-background/40 p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            {t.common.preview}
                        </div>
                        <div className="max-h-56 overflow-auto rounded-md border bg-background p-3 text-sm leading-7">
                            {lines.map((line, lineIndex) => (
                                <p key={`line-${lineIndex}`} className="min-h-[1.75rem]">
                                    {line.map((segment, index) => (
                                        <span key={`segment-${lineIndex}-${index}`} className={segment.bold ? "font-extrabold" : undefined}>
                                            {segment.text}
                                        </span>
                                    ))}
                                </p>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[220px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>

            <RelatedTools toolKey="bionic_reading_converter" />
        </ToolPageContainer>
    )
}
