"use client"

import * as React from "react"
import { Copy, RefreshCw, TextQuote, Type } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { loremIpsum } from "lorem-ipsum"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    clampLoremCount,
    formatParagraphOutput,
    LOREM_PRESETS,
    splitPlainParagraphs,
    type LoremFormat,
    type LoremPreset,
    type LoremUnits,
} from "@/features/tools/lorem-ipsum/utils"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPageContainer } from "@/components/layout/page-container"

export function LoremIpsumGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["lorem_ipsum"] as Record<string, string>

    const [output, setOutput] = React.useState("")
    const [paragraphs, setParagraphs] = React.useState<string[]>([])
    const [count, setCount] = React.useState(3)
    const [units, setUnits] = React.useState<LoremUnits>("paragraphs")
    const [format, setFormat] = React.useState<LoremFormat>("plain")
    const [activePreset, setActivePreset] = React.useState<LoremPreset["id"] | null>("layout")

    const generateText = React.useCallback(() => {
        const qty = clampLoremCount(count)

        if (units === "paragraphs") {
            const plainParagraphText = loremIpsum({
                count: qty,
                format: "plain",
                units: "paragraphs",
                paragraphLowerBound: 3,
                paragraphUpperBound: 7,
                sentenceLowerBound: 5,
                sentenceUpperBound: 15,
            })

            const nextParagraphs = splitPlainParagraphs(plainParagraphText)
            setParagraphs(nextParagraphs)
            setOutput(formatParagraphOutput(nextParagraphs, format))
            return
        }

        const text = loremIpsum({
            count: qty,
            format,
            units,
            paragraphLowerBound: 3,
            paragraphUpperBound: 7,
            sentenceLowerBound: 5,
            sentenceUpperBound: 15,
        })

        setParagraphs([])
        setOutput(text)
    }, [count, format, units])

    React.useEffect(() => {
        generateText()
    }, [generateText])

    const applyPreset = (preset: LoremPreset) => {
        setCount(preset.count)
        setUnits(preset.units)
        setFormat(preset.format)
        setActivePreset(preset.id)
    }

    const updateCount = (value: string) => {
        const parsed = Number.parseInt(value, 10)
        if (Number.isNaN(parsed)) {
            setCount(1)
            setActivePreset(null)
            return
        }
        setCount(clampLoremCount(parsed))
        setActivePreset(null)
    }

    const handleCopy = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: toolT.copied_output,
        })
    }

    const handleCopyParagraph = async (paragraph: string, index: number) => {
        const value = format === "html" ? `<p>${paragraph}</p>` : paragraph
        const result = await safeClipboardWrite(value)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: (toolT.copied_paragraph).replace("{index}", String(index + 1)),
        })
    }

    const presetLabel = (presetId: LoremPreset["id"]) => {
        if (presetId === "layout") return toolT.preset_layout
        if (presetId === "article") return toolT.preset_article
        if (presetId === "microcopy") return toolT.preset_microcopy
        return toolT.preset_html
    }

    const showParagraphCopies = units === "paragraphs" && paragraphs.length > 0
    const actions: ToolAction[] = [
        {
            id: "regenerate",
            label: toolT.regenerate,
            icon: RefreshCw,
            onClick: generateText,
            variant: "default",
        },
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                <div className="flex flex-col space-y-6 md:col-span-4 lg:col-span-3">
                    <div className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            {toolT.settings}
                        </h3>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{toolT.count}</label>
                            <Input
                                type="number"
                                min={1}
                                max={1000}
                                value={count}
                                onChange={(event) => updateCount(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{toolT.type}</label>
                            <Select
                                value={units}
                                onValueChange={(value: LoremUnits) => {
                                    setUnits(value)
                                    setActivePreset(null)
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={toolT.select_type} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paragraphs">{toolT.paragraphs}</SelectItem>
                                    <SelectItem value="sentences">{toolT.sentences}</SelectItem>
                                    <SelectItem value="words">{toolT.words}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.common.format}</label>
                            <Select
                                value={format}
                                onValueChange={(value: LoremFormat) => {
                                    setFormat(value)
                                    setActivePreset(null)
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={toolT.select_format} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="plain">{toolT.plain_text}</SelectItem>
                                    <SelectItem value="html">{toolT.html_tags}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{toolT.presets}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {LOREM_PRESETS.map((preset) => (
                                    <Button
                                        key={preset.id}
                                        variant={activePreset === preset.id ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => applyPreset(preset)}
                                    >
                                        {presetLabel(preset.id)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm md:col-span-8 lg:col-span-9">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.generated_result}</span>
                        <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => void handleCopy()}>
                            <Copy className="h-4 w-4" />
                            {toolT.copy_output}
                        </Button>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[320px] w-full resize-none border-0 p-6 font-sans text-sm leading-8 text-foreground focus-visible:ring-1 focus-visible:ring-ring/50"
                            value={output}
                            readOnly
                            spellCheck={false}
                        />
                    </div>

                    {showParagraphCopies ? (
                        <div className="border-t bg-muted/20 p-4">
                            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                                <TextQuote className="h-4 w-4 text-primary" />
                                {toolT.paragraph_copy_title}
                            </div>
                            <div className="space-y-2">
                                {paragraphs.map((paragraph, index) => (
                                    <div key={`${index}-${paragraph.slice(0, 16)}`} className="rounded-md border bg-background p-3">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                {(toolT.paragraph_label).replace("{index}", String(index + 1))}
                                            </span>
                                            <Button variant="outline" size="sm" onClick={() => void handleCopyParagraph(paragraph, index)}>
                                                <Copy className="mr-2 h-3.5 w-3.5" />
                                                {toolT.copy_paragraph}
                                            </Button>
                                        </div>
                                        <p className="line-clamp-3 text-xs text-muted-foreground">{paragraph}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </ToolPageContainer>
    )
}
