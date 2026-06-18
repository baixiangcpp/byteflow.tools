"use client"

import * as React from "react"
import { FileSpreadsheet, Eraser, Plus, Minus, Equal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { buildInputTooLargeMessage, countNonEmptyLines, isOverUtf8Budget, TOOL_RUNTIME_BUDGETS } from "@/core/performance/tool-runtime-budgets"

function parseCsv(text: string): string[][] {
    const rows: string[][] = []
    const lines = text.split("\n")
    for (const line of lines) {
        if (!line.trim()) continue
        rows.push(line.split(",").map((c) => c.trim()))
    }
    return rows
}

interface DiffRow {
    type: "added" | "removed" | "modified" | "unchanged"
    left: string[]
    right: string[]
    rowIndex: number
}

function diffCsv(left: string[][], right: string[][]): DiffRow[] {
    const results: DiffRow[] = []
    const maxRows = Math.max(left.length, right.length)

    for (let i = 0; i < maxRows; i++) {
        const l = left[i]
        const r = right[i]
        if (!l && r) {
            results.push({ type: "added", left: [], right: r, rowIndex: i })
        } else if (l && !r) {
            results.push({ type: "removed", left: l, right: [], rowIndex: i })
        } else if (l && r) {
            const equal = l.length === r.length && l.every((v, j) => v === r[j])
            results.push({ type: equal ? "unchanged" : "modified", left: l, right: r, rowIndex: i })
        }
    }
    return results
}

export function CsvDiffPage() {
    const { t } = useLang()
    const [leftCsv, setLeftCsv] = React.useState("c1,c2,c3\n001,10,a-100\n002,20,b-200\n003,30,c-300")
    const [rightCsv, setRightCsv] = React.useState("c1,c2,c3\n001,12,a-100\n002,20,b-200\n004,28,d-400")
    const [diff, setDiff] = React.useState<DiffRow[]>([])
    const [error, setError] = React.useState<string | null>(null)

    const compare = () => {
        if (isOverUtf8Budget(leftCsv, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes) || isOverUtf8Budget(rightCsv, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes)) {
            setDiff([])
            setError(buildInputTooLargeMessage(t.common.local_input_too_large, TOOL_RUNTIME_BUDGETS.maxDiffInputBytes))
            return
        }
        if (countNonEmptyLines(leftCsv, TOOL_RUNTIME_BUDGETS.maxDiffRows).exceeded || countNonEmptyLines(rightCsv, TOOL_RUNTIME_BUDGETS.maxDiffRows).exceeded) {
            setDiff([])
            setError(t.common.local_row_limit_exceeded.replace("{count}", String(TOOL_RUNTIME_BUDGETS.maxDiffRows)))
            return
        }
        const left = parseCsv(leftCsv)
        const right = parseCsv(rightCsv)
        setDiff(diffCsv(left, right))
        setError(null)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => { compare() }, [leftCsv, rightCsv])

    const stats = {
        added: diff.filter((d) => d.type === "added").length,
        removed: diff.filter((d) => d.type === "removed").length,
        modified: diff.filter((d) => d.type === "modified").length,
        unchanged: diff.filter((d) => d.type === "unchanged").length,
    }

    const toolT = t.tools["csv_diff"] as Record<string, string>
    const typeStyles = {
        added: "bg-emerald-500/10 border-l-emerald-500",
        removed: "bg-red-500/10 border-l-red-500",
        modified: "bg-amber-500/10 border-l-amber-500",
        unchanged: "bg-transparent border-l-transparent",
    }
    const typeIcons = { added: <Plus className="h-3.5 w-3.5 text-emerald-500" />, removed: <Minus className="h-3.5 w-3.5 text-red-500" />, modified: <FileSpreadsheet className="h-3.5 w-3.5 text-amber-500" />, unchanged: <Equal className="h-3.5 w-3.5 text-muted-foreground" /> }

    return (
        <div className="flex flex-col h-full space-y-6 max-w-[1400px] mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <FileSpreadsheet className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">{toolT.description}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setLeftCsv(""); setRightCsv(""); setDiff([]); setError(null) }}>
                    <Eraser className="mr-2 h-4 w-4" />{t.common.clear}
                </Button>
            </div>

            {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div className="tool-pane-header">{toolT.original}</div>
                    <Textarea className="flex-1 min-h-[200px] resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 font-mono text-sm p-4" value={leftCsv} onChange={(e) => setLeftCsv(e.target.value)} spellCheck={false} />
                </div>
                <div className="flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div className="tool-pane-header">{toolT.modified}</div>
                    <Textarea className="flex-1 min-h-[200px] resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 font-mono text-sm p-4" value={rightCsv} onChange={(e) => setRightCsv(e.target.value)} spellCheck={false} />
                </div>
            </div>

            {/* Stats */}
            {diff.length > 0 && (
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-emerald-500"><Plus className="h-4 w-4" />{stats.added} {toolT.added}</span>
                    <span className="flex items-center gap-1 text-red-500"><Minus className="h-4 w-4" />{stats.removed} {toolT.removed}</span>
                    <span className="flex items-center gap-1 text-amber-500"><FileSpreadsheet className="h-4 w-4" />{stats.modified} {toolT.modified_label}</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Equal className="h-4 w-4" />{stats.unchanged} {toolT.unchanged}</span>
                </div>
            )}

            {/* Diff Table */}
            {diff.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b">
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10">#</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10"></th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{toolT.original}</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{toolT.modified}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {diff.map((row, i) => (
                                    <tr key={i} className={`border-b border-l-4 ${typeStyles[row.type]}`}>
                                        <td className="px-3 py-1.5 text-xs text-muted-foreground">{row.rowIndex + 1}</td>
                                        <td className="px-3 py-1.5">{typeIcons[row.type]}</td>
                                        <td className="px-3 py-1.5 font-mono text-xs">{row.left.join(", ") || "—"}</td>
                                        <td className="px-3 py-1.5 font-mono text-xs">{row.right.join(", ") || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <RelatedTools toolKey="csv_diff" />
        </div>
    )
}
