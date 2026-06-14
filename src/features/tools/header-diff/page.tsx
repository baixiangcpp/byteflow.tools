"use client"

import * as React from "react"
import { ArrowLeftRight, Eraser, Plus, Minus, Equal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"

interface HeaderEntry { key: string; value: string }

function parseHeaders(text: string): HeaderEntry[] {
    return text.split("\n").filter((l) => l.trim()).map((line) => {
        const idx = line.indexOf(":")
        if (idx < 0) return { key: line.trim(), value: "" }
        return { key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
    })
}

interface HeaderDiff { key: string; leftValue: string; rightValue: string; type: "added" | "removed" | "modified" | "unchanged" }

function diffHeaders(left: HeaderEntry[], right: HeaderEntry[]): HeaderDiff[] {
    const results: HeaderDiff[] = []
    const leftMap = new Map(left.map((h) => [h.key.toLowerCase(), h]))
    const rightMap = new Map(right.map((h) => [h.key.toLowerCase(), h]))
    const allKeys = new Set([...leftMap.keys(), ...rightMap.keys()])

    for (const key of allKeys) {
        const l = leftMap.get(key)
        const r = rightMap.get(key)
        if (l && !r) results.push({ key: l.key, leftValue: l.value, rightValue: "", type: "removed" })
        else if (!l && r) results.push({ key: r.key, leftValue: "", rightValue: r.value, type: "added" })
        else if (l && r) results.push({ key: l.key, leftValue: l.value, rightValue: r.value, type: l.value === r.value ? "unchanged" : "modified" })
    }
    return results.sort((a, b) => { const order = { removed: 0, modified: 1, added: 2, unchanged: 3 }; return order[a.type] - order[b.type] })
}

export function HeaderDiffPage() {
    const { t } = useLang()
    const [leftText, setLeftText] = React.useState("Content-Type: application/json\nAuthorization: Bearer token123\nAccept: */*\nX-Request-Id: abc-123\nCache-Control: no-cache")
    const [rightText, setRightText] = React.useState("Content-Type: text/html\nAuthorization: Bearer token456\nAccept: */*\nX-Forwarded-For: 1.2.3.4\nCache-Control: max-age=3600")
    const [diff, setDiff] = React.useState<HeaderDiff[]>([])

    React.useEffect(() => {
        const left = parseHeaders(leftText)
        const right = parseHeaders(rightText)
        setDiff(diffHeaders(left, right))
    }, [leftText, rightText])

    const stats = { added: diff.filter((d) => d.type === "added").length, removed: diff.filter((d) => d.type === "removed").length, modified: diff.filter((d) => d.type === "modified").length, unchanged: diff.filter((d) => d.type === "unchanged").length }
    const toolT = t.tools["header_diff"] as Record<string, string>
    const typeColors = { added: "border-l-emerald-500 bg-emerald-500/5", removed: "border-l-red-500 bg-red-500/5", modified: "border-l-amber-500 bg-amber-500/5", unchanged: "border-l-transparent" }
    const typeIcons = { added: <Plus className="h-3.5 w-3.5 text-emerald-500" />, removed: <Minus className="h-3.5 w-3.5 text-red-500" />, modified: <ArrowLeftRight className="h-3.5 w-3.5 text-amber-500" />, unchanged: <Equal className="h-3.5 w-3.5 text-muted-foreground" /> }

    return (
        <div className="flex flex-col h-full space-y-6 max-w-[1400px] mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ArrowLeftRight className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">{toolT.description}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setLeftText(""); setRightText("") }}>
                    <Eraser className="mr-2 h-4 w-4" />{t.common.clear}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div className="tool-pane-header">{toolT.left}</div>
                    <Textarea className="flex-1 min-h-[180px] resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 font-mono text-sm p-4" value={leftText} onChange={(e) => setLeftText(e.target.value)} placeholder="Accept: application/json" spellCheck={false} />
                </div>
                <div className="flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div className="tool-pane-header">{toolT.right}</div>
                    <Textarea className="flex-1 min-h-[180px] resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 font-mono text-sm p-4" value={rightText} onChange={(e) => setRightText(e.target.value)} placeholder="Accept: application/json" spellCheck={false} />
                </div>
            </div>

            {diff.length > 0 && (
                <>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-emerald-500"><Plus className="h-4 w-4" />{stats.added} {toolT.added}</span>
                        <span className="flex items-center gap-1 text-red-500"><Minus className="h-4 w-4" />{stats.removed} {toolT.removed}</span>
                        <span className="flex items-center gap-1 text-amber-500"><ArrowLeftRight className="h-4 w-4" />{stats.modified} {toolT.modified_label}</span>
                        <span className="flex items-center gap-1 text-muted-foreground"><Equal className="h-4 w-4" />{stats.unchanged} {toolT.unchanged}</span>
                    </div>
                    <div className="space-y-2">
                        {diff.map((d, i) => (
                            <div key={i} className={`p-3 border rounded-lg border-l-4 ${typeColors[d.type]} flex items-start gap-3`}>
                                <div className="pt-0.5">{typeIcons[d.type]}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-mono text-sm font-semibold">{d.key}</div>
                                    {d.type !== "added" && <div className="font-mono text-xs text-red-500/70 break-all">- {d.leftValue}</div>}
                                    {d.type !== "removed" && <div className="font-mono text-xs text-emerald-500/70 break-all">+ {d.rightValue}</div>}
                                    {d.type === "unchanged" && <div className="font-mono text-xs text-muted-foreground break-all">{d.leftValue}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            <RelatedTools toolKey="header_diff" />
        </div>
    )
}
