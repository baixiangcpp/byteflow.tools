"use client"

import * as React from "react"
import { Type, Eraser, TestTube2, Copy, Download } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { formatLetterCounterSummary, getLetterCounterStats, type LetterCounterSummaryLabels } from "@/features/tools/letter-counter/utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

const SAMPLE_TEXT = "ABC 123\nxyz 456"

export function LetterCounterPage() {
    const { t } = useLang()
    const toolT = t.tools["letter_counter"] as Record<string, string>
    const text = (key: string) => toolT[key]

    const [input, setInput] = React.useState("")

    const stats = React.useMemo(() => getLetterCounterStats(input), [input])
    const summaryLabels = React.useMemo<LetterCounterSummaryLabels>(
        () => ({
            characters: toolT.characters,
            charactersNoSpaces: toolT.characters_no_spaces,
            words: toolT.words,
            lines: toolT.lines,
            letters: toolT.letters,
            digits: toolT.digits,
        }),
        [toolT],
    )
    const summary = React.useMemo(() => formatLetterCounterSummary(stats, summaryLabels), [stats, summaryLabels])

    const handleSample = () => {
        setInput(SAMPLE_TEXT)
    }

    const handleClear = () => {
        setInput("")
    }

    const handleCopy = async () => {
        const result = await safeClipboardWrite(summary)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: t.common.copied_desc,
        })
    }

    const handleDownload = () => {
        const blob = new Blob([summary], { type: "text/plain;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "letter-counter-summary.txt"
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
            id: "download",
            label: t.common.download,
            icon: Download,
            onClick: handleDownload,
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Type className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {text("description")}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                <StatCard label={text("characters")} value={stats.characters} />
                <StatCard label={text("characters_no_spaces")} value={stats.charactersNoSpaces} />
                <StatCard label={text("words")} value={stats.words} />
                <StatCard label={text("lines")} value={stats.lines} />
                <StatCard label={text("letters")} value={stats.letters} />
                <StatCard label={text("digits")} value={stats.digits} />
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
                        <span>{text("summary")}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">{t.common.copy_output}</span>
                        </Button>
                    </div>
                    <div className="relative flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[400px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            value={summary}
                            readOnly
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border bg-card p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold leading-none">{value}</div>
        </div>
    )
}
