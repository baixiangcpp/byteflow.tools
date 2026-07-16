"use client"

import * as React from "react"
import { Copy, FileText, GitBranch, Play } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { visualizeStructuredData, type DataTreeNode, type StructuredDataFormat, type StructuredDataResult } from "@/features/tools/structured-data-visualizer/utils"
import { WideToolPageContainer } from "@/components/layout/page-container"

function TreeNodeView({ node, depth = 0 }: { node: DataTreeNode; depth?: number }) {
    return (
        <div>
            <div className="flex items-center gap-2 border-b px-3 py-1.5 text-sm" style={{ paddingLeft: `${12 + depth * 16}px` }}>
                <span className="font-mono text-primary">{node.key}</span>
                <span className="rounded border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">{node.type}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">{node.valuePreview}</span>
            </div>
            {node.children.slice(0, 300).map((child) => <TreeNodeView key={child.id} node={child} depth={depth + 1} />)}
        </div>
    )
}

export function StructuredDataVisualizerPage() {
    const { t } = useLang()
    const toolT = t.tools["structured_data_visualizer"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [input, setInput] = React.useState("")
    const [format, setFormat] = React.useState<StructuredDataFormat>("json")
    const [result, setResult] = React.useState<StructuredDataResult | null>(null)

    const run = React.useCallback(() => {
        if (!input.trim()) {
            toast.error(t.common.input_required)
            return
        }
        const next = visualizeStructuredData(input, format)
        setResult(next)
        if (next.error) toast.error(text("parse_failed"))
        else toast.success(text("visualized"))
    }, [format, input, t.common.input_required, text])

    const copySummary = React.useCallback(async () => {
        if (!result?.root) return
        const summary = JSON.stringify({
            stats: result.stats,
            truncated: result.truncated,
            limits: { maxNodes: result.maxNodes, maxDepth: result.maxDepth },
            edges: result.edges.slice(0, 50),
        }, null, 2)
        const copyResult = await safeClipboardWrite(summary)
        if (!copyResult.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }, [result, t.common.copy_failed, t.common.copied])

    const loadExample = React.useCallback(() => {
        setFormat("json")
        setInput(JSON.stringify({ service: { image: "nginx", ports: [80, 443], env: { LOG_LEVEL: "info" } }, dependencies: ["redis", "postgres"] }, null, 2))
        setResult(null)
    }, [])

    return (
        <WideToolPageContainer className="flex flex-col gap-6 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <GitBranch className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">{text("description")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={loadExample}><FileText className="mr-2 h-4 w-4" />{t.common.try_example}</Button>
                    <Button size="sm" onClick={run}><Play className="mr-2 h-4 w-4" />{text("visualize")}</Button>
                    <Button variant="outline" size="sm" onClick={() => void copySummary()} disabled={!result?.root}><Copy className="mr-2 h-4 w-4" />{text("copy_summary")}</Button>
                </div>
            </div>

            <div className="max-w-xs space-y-2">
                <Label>{text("format_label")}</Label>
                <Select value={format} onValueChange={(value) => setFormat(value as StructuredDataFormat)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="yaml">YAML</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {result?.error && <Alert variant="destructive"><AlertDescription>{result.error}</AlertDescription></Alert>}
            {result?.truncated && (
                <Alert>
                    <AlertDescription>
                        {text("truncated_warning")
                            .replace("{maxNodes}", String(result.maxNodes))
                            .replace("{maxDepth}", String(result.maxDepth))}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-2">
                    <Label>{text("input_label")}</Label>
                    <Textarea value={input} onChange={(event) => setInput(event.target.value)} className="min-h-[560px] font-mono text-sm" placeholder={text("input_placeholder")} />
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("nodes")}</div><div className="text-2xl font-bold">{result?.stats.nodes ?? 0}</div></div>
                        <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("arrays")}</div><div className="text-2xl font-bold">{result?.stats.arrays ?? 0}</div></div>
                        <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("scalars")}</div><div className="text-2xl font-bold">{result?.stats.scalars ?? 0}</div></div>
                        <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("max_depth")}</div><div className="text-2xl font-bold">{result?.stats.maxDepth ?? 0}</div></div>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                        <div className="border-b bg-muted px-4 py-2 text-sm font-semibold">{text("tree_title")}</div>
                        <div className="max-h-[420px] overflow-auto">
                            {result?.root ? <TreeNodeView node={result.root} /> : <div className="p-4 text-sm text-muted-foreground">{text("empty_state")}</div>}
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                        <div className="border-b bg-muted px-4 py-2 text-sm font-semibold">{text("edges_title")}</div>
                        <div className="max-h-[180px] overflow-auto p-3 font-mono text-xs text-muted-foreground">
                            {(result?.edges || []).slice(0, 30).map((edge) => <div key={`${edge.from}-${edge.to}`}>{edge.from} -&gt; {edge.to}</div>)}
                        </div>
                    </div>
                </div>
            </div>
        </WideToolPageContainer>
    )
}
