"use client"

import * as React from "react"
import { Download, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { Label } from "@/components/ui/label"
import {
    parseLogs,
    filterLogs,
    exportToCSV,
    exportToJSON,
    type LogAnalysis,
    type LogLevel,
} from "@/features/tools/local-log-parser/utils"
import { Checkbox } from "@/components/ui/checkbox"

export function LocalLogParserPage() {
    const { t } = useLang()
    const toolT = t.tools["local_log_parser"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [input, setInput] = React.useState("")
    const [analysis, setAnalysis] = React.useState<LogAnalysis | null>(null)
    const [hasParsed, setHasParsed] = React.useState(false)
    const [selectedLevels, setSelectedLevels] = React.useState<Set<LogLevel>>(new Set())
    const [keyword, setKeyword] = React.useState("")

    const filteredEntries = React.useMemo(() => {
        if (!analysis) return []
        return filterLogs(analysis.entries, {
            levels: selectedLevels.size > 0 ? Array.from(selectedLevels) : undefined,
            keyword: keyword.trim(),
        })
    }, [analysis, selectedLevels, keyword])

    const stats = React.useMemo(() => {
        if (!analysis) return null
        return {
            total: analysis.totalLines,
            parsed: analysis.parsedCount,
            unparsed: analysis.unparsedCount,
            levelCounts: analysis.levelCounts,
        }
    }, [analysis])

    const handleParse = React.useCallback(() => {
        if (!input.trim()) {
            toast.error(t.common.input_required)
            return
        }

        const nextAnalysis = parseLogs(input)
        setAnalysis(nextAnalysis)
        setHasParsed(true)
        toast.success(text("lines_parsed").replace("{count}", String(nextAnalysis.totalLines)))
    }, [input, text, t.common.input_required])

    const handleToggleLevel = React.useCallback((level: LogLevel) => {
        setSelectedLevels((prev) => {
            const next = new Set(prev)
            if (next.has(level)) {
                next.delete(level)
            } else {
                next.add(level)
            }
            return next
        })
    }, [])

    const handleExportCSV = React.useCallback(() => {
        if (filteredEntries.length === 0) {
            toast.error(text("no_entries_to_export"))
            return
        }

        const csv = exportToCSV(filteredEntries)
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "logs.csv"
        a.click()
        URL.revokeObjectURL(url)
        toast.success(text("csv_downloaded"))
    }, [filteredEntries, text])

    const handleExportJSON = React.useCallback(() => {
        if (filteredEntries.length === 0) {
            toast.error(text("no_entries_to_export"))
            return
        }

        const json = exportToJSON(filteredEntries)
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "logs.json"
        a.click()
        URL.revokeObjectURL(url)
        toast.success(text("json_downloaded"))
    }, [filteredEntries, text])

    const handleLoadExample = React.useCallback(() => {
        const example = `2024-01-15T10:30:00Z INFO Server started on port 3000
{"timestamp":"2024-01-15T10:30:01Z","level":"INFO","message":"Database connected"}
2024-01-15T10:30:05Z WARN Slow query detected: 1.2s
{"timestamp":"2024-01-15T10:30:10Z","level":"ERROR","message":"Failed to load user profile","userId":123}
2024-01-15T10:31:00Z INFO Request processed successfully`
        setInput(example)
        toast.info(text("example_logs_loaded"))
    }, [text])

    React.useEffect(() => {
        if (!hasParsed) return
        if (!input.trim()) {
            setAnalysis(null)
            return
        }

        const timeoutId = window.setTimeout(() => {
            setAnalysis(parseLogs(input))
        }, 350)

        return () => window.clearTimeout(timeoutId)
    }, [input, hasParsed])

    const levelColors: Record<LogLevel, string> = {
        TRACE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        DEBUG: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        INFO: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        WARN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        WARNING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        ERROR: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        FATAL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        UNKNOWN: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    }

    return (
        <div className="container mx-auto max-w-7xl py-8 px-4 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{text("title")}</h1>
                <p className="text-muted-foreground">{text("description")}</p>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleLoadExample}>
                    <FileText className="w-4 h-4 mr-1" />
                    {t.common.try_example}
                </Button>
            </div>

            <div className="space-y-2">
                <Label className="font-semibold">{text("input_label")}</Label>
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={text("input_placeholder")}
                    className="min-h-[200px] font-mono text-sm"
                />
            </div>

            <Button onClick={handleParse} className="w-full" size="lg">
                {text("parse_button")}
            </Button>

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">{text("total_lines")}</div>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">{text("parsed_lines")}</div>
                        <div className="text-2xl font-bold">{stats.parsed}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">{text("filtered_shown")}</div>
                        <div className="text-2xl font-bold">{filteredEntries.length}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">{text("error_count")}</div>
                        <div className="text-2xl font-bold text-red-600">{stats.levelCounts.ERROR + stats.levelCounts.FATAL}</div>
                    </div>
                </div>
            )}

            {stats && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <Label className="font-semibold">{text("filter_by_level")}</Label>
                        {(["ERROR", "WARN", "INFO", "DEBUG"] as LogLevel[]).map((level) => (
                            <div key={level} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`level-${level}`}
                                    checked={selectedLevels.has(level)}
                                    onCheckedChange={() => handleToggleLevel(level)}
                                />
                                <Label htmlFor={`level-${level}`} className="cursor-pointer">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${levelColors[level]}`}>
                                        {level} ({stats.levelCounts[level]})
                                    </span>
                                </Label>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Label>{text("filter_by_keyword")}</Label>
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder={text("keyword_placeholder")}
                                className="w-full mt-1 px-3 py-2 border rounded-md"
                            />
                        </div>
                        <Button variant="outline" onClick={() => { setKeyword(""); setSelectedLevels(new Set()); }}>
                            {t.common.clear}
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExportCSV}>
                            <Download className="w-4 h-4 mr-1" />
                            {text("export_csv")}
                        </Button>
                        <Button variant="outline" onClick={handleExportJSON}>
                            <Download className="w-4 h-4 mr-1" />
                            {text("export_json")}
                        </Button>
                    </div>
                </div>
            )}

            {filteredEntries.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left">{text("table_line")}</th>
                                    <th className="px-4 py-2 text-left">{text("table_timestamp")}</th>
                                    <th className="px-4 py-2 text-left">{text("table_level")}</th>
                                    <th className="px-4 py-2 text-left">{text("table_message")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map((entry, idx) => (
                                    <tr key={idx} className="border-t hover:bg-muted/50">
                                        <td className="px-4 py-2 font-mono text-xs">{entry.lineNumber}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{entry.timestamp || "-"}</td>
                                        <td className="px-4 py-2">
                                            {entry.level && (
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${levelColors[entry.level]}`}>
                                                    {entry.level}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 font-mono text-xs max-w-md truncate">
                                            {entry.message || entry.raw}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
