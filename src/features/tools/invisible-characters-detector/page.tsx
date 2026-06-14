"use client"

import * as React from "react"
import { AlertCircle, Copy, Eraser, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    analyzeText,
    cleanText,
    formatCodePoint,
    getCategoryLabel,
    type CharacterCategory,
    type TextAnalysis,
} from "@/core/utils/invisible-chars-utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function InvisibleCharsDetectorPage() {
    const { t } = useLang()
    const toolT = t.tools["invisible_chars_detector"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [input, setInput] = React.useState("")
    const [analysis, setAnalysis] = React.useState<TextAnalysis | null>(null)
    const [cleanedText, setCleanedText] = React.useState("")

    const [removeZeroWidth, setRemoveZeroWidth] = React.useState(true)
    const [normalizeSpaces, setNormalizeSpaces] = React.useState(true)
    const [removeControl, setRemoveControl] = React.useState(true)

    const handleInputChange = React.useCallback((value: string) => {
        setInput(value)
        setCleanedText("")
        if (value.length === 0) {
            setAnalysis(null)
        } else {
            const result = analyzeText(value)
            setAnalysis(result)
        }
    }, [])

    const handleClean = React.useCallback(() => {
        if (!input) return

        const cleaned = cleanText(input, {
            removeZeroWidth,
            normalizeSpaces,
            removeControlExceptNewlineTab: removeControl,
        })
        setCleanedText(cleaned)
        toast.success(text("cleaned"))
    }, [input, removeZeroWidth, normalizeSpaces, removeControl, text])

    const handleCopyCleaned = React.useCallback(async () => {
        if (!cleanedText) return
        const success = await safeClipboardWrite(cleanedText)
        if (success) {
            toast.success(t.common.copied)
        } else {
            toast.error(t.common.copy_failed)
        }
    }, [cleanedText, t])

    const handleLoadExample = React.useCallback(() => {
        const zwsp = String.fromCodePoint(0x200b)
        const nbsp = String.fromCodePoint(0x00a0)
        const zwnj = String.fromCodePoint(0x200c)
        const fullWidthSpace = String.fromCodePoint(0x3000)
        const nullChar = String.fromCodePoint(0x00)
        const zwj = String.fromCodePoint(0x200d)
        const example = `Hello${zwsp}World${nbsp}Test\nLine${zwnj}Two${fullWidthSpace}End\t${nullChar}Tab\rCarriage${zwj}Return`
        handleInputChange(example)
        toast.info(text("example_loaded"))
    }, [handleInputChange, text])

    const categoryColors: Record<CharacterCategory, string> = {
        "zero-width": "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
        control: "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100",
        "whitespace-non-standard": "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100",
        bom: "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100",
        "line-ending": "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
        tab: "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100",
    }

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{text("title")}</h1>
                <p className="text-muted-foreground">{text("description")}</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Label className="font-semibold">{text("input_label")}</Label>
                    <Button variant="outline" size="sm" onClick={handleLoadExample}>
                        <FileText className="w-4 h-4 mr-1" />
                        {t.common.try_example}
                    </Button>
                </div>
                <Textarea
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={text("input_placeholder")}
                    className="min-h-[200px] font-mono text-sm"
                />

                {analysis && (
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>
                            {text("total_chars")}: <strong>{analysis.totalChars}</strong>
                        </span>
                        <span>
                            {text("total_lines")}: <strong>{analysis.totalLines}</strong>
                        </span>
                        <span className={analysis.suspiciousChars.length > 0 ? "text-red-600 dark:text-red-400 font-semibold" : ""}>
                            {text("suspicious_chars")}: <strong>{analysis.suspiciousChars.length}</strong>
                        </span>
                    </div>
                )}
            </div>

            {analysis && analysis.suspiciousChars.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <h2 className="text-xl font-semibold">{text("suspicious_found")}</h2>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-4 py-2 text-left">{text("table_position")}</th>
                                        <th className="px-4 py-2 text-left">{text("table_code_point")}</th>
                                        <th className="px-4 py-2 text-left">{text("table_name")}</th>
                                        <th className="px-4 py-2 text-left">{text("table_category")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.suspiciousChars.map((char, idx) => (
                                        <tr key={idx} className="border-t hover:bg-muted/50">
                                            <td className="px-4 py-2 font-mono text-xs">
                                                L{char.line}:C{char.column}
                                            </td>
                                            <td className="px-4 py-2 font-mono text-xs">{formatCodePoint(char.codePoint)}</td>
                                            <td className="px-4 py-2">{char.displayName}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[char.category]}`}>
                                                    {getCategoryLabel(char.category)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <h3 className="font-semibold">{text("clean_options_title")}</h3>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="remove-zero-width" checked={removeZeroWidth} onCheckedChange={(checked) => setRemoveZeroWidth(!!checked)} />
                                <Label htmlFor="remove-zero-width" className="cursor-pointer">
                                    {text("option_remove_zero_width")}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="normalize-spaces" checked={normalizeSpaces} onCheckedChange={(checked) => setNormalizeSpaces(!!checked)} />
                                <Label htmlFor="normalize-spaces" className="cursor-pointer">
                                    {text("option_normalize_spaces")}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="remove-control" checked={removeControl} onCheckedChange={(checked) => setRemoveControl(!!checked)} />
                                <Label htmlFor="remove-control" className="cursor-pointer">
                                    {text("option_remove_control")}
                                </Label>
                            </div>
                        </div>
                        <Button onClick={handleClean} className="w-full">
                            <Eraser className="w-4 h-4 mr-2" />
                            {text("clean_button")}
                        </Button>
                        {cleanedText ? (
                            <p role="status" className="text-sm text-muted-foreground">
                                {text("cleaned_output_ready")}
                            </p>
                        ) : null}
                    </div>

                    {cleanedText && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="font-semibold">{text("cleaned_output")}</Label>
                                <Button variant="outline" size="sm" onClick={handleCopyCleaned}>
                                    <Copy className="w-4 h-4 mr-1" />
                                    {t.common.copy}
                                </Button>
                            </div>
                            <Textarea value={cleanedText} readOnly className="min-h-[150px] font-mono text-sm bg-muted" />
                        </div>
                    )}
                </div>
            )}

            {analysis && analysis.suspiciousChars.length === 0 && input.length > 0 && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100">
                    <p className="font-medium">{text("no_suspicious_found")}</p>
                </div>
            )}
        </div>
    )
}
