"use client"

import * as React from "react"
import { Copy, FileText, Search } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { parseAsn1Der, type Asn1Node, type Asn1ParseResult } from "@/features/tools/asn1-der-inspector/utils"

function NodeView({ node, depth = 0 }: { node: Asn1Node; depth?: number }) {
    return (
        <div>
            <div className="grid grid-cols-[96px_120px_minmax(0,1fr)_96px] gap-3 border-b px-3 py-1.5 text-sm" style={{ paddingLeft: `${12 + depth * 16}px` }}>
                <span className="font-mono text-xs text-muted-foreground">{node.offset}</span>
                <span className="font-mono text-xs">{node.tagName}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">{node.valuePreview}</span>
                <span className="font-mono text-xs text-muted-foreground">{node.length} bytes</span>
            </div>
            {node.children.map((child) => <NodeView key={child.id} node={child} depth={depth + 1} />)}
        </div>
    )
}

export function Asn1DerInspectorPage() {
    const { t } = useLang()
    const toolT = t.tools["asn1_der_inspector"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [input, setInput] = React.useState("")
    const [result, setResult] = React.useState<Asn1ParseResult | null>(null)

    const run = React.useCallback(() => {
        if (!input.trim()) {
            toast.error(t.common.input_required)
            return
        }
        const next = parseAsn1Der(input)
        setResult(next)
        if (next.ok) toast.success(text("parsed"))
        else toast.error(text("parse_failed"))
    }, [input, t.common.input_required, text])

    const copyJson = React.useCallback(async () => {
        if (!result?.nodes.length) return
        const copied = await safeClipboardWrite(JSON.stringify(result.nodes, null, 2))
        if (!copied.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }, [result, t.common.copy_failed, t.common.copied])

    const loadExample = React.useCallback(() => {
        setInput("30 0D 02 01 05 06 08 2A 86 48 86 F7 0D 01 01")
        setResult(null)
    }, [])

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Search className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{text("description")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={loadExample}><FileText className="mr-2 h-4 w-4" />{t.common.try_example}</Button>
                    <Button size="sm" onClick={run}><Search className="mr-2 h-4 w-4" />{text("inspect_action")}</Button>
                    <Button variant="outline" size="sm" onClick={() => void copyJson()} disabled={!result?.nodes.length}><Copy className="mr-2 h-4 w-4" />{text("copy_tree")}</Button>
                </div>
            </div>

            <Alert><AlertDescription>{text("scope_note")}</AlertDescription></Alert>
            {result?.error ? <Alert variant="destructive"><AlertDescription>{result.error}</AlertDescription></Alert> : null}
            {result?.truncated ? <Alert><AlertDescription>{text("truncated_warning")}</AlertDescription></Alert> : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <section className="space-y-2">
                    <Label htmlFor="asn1-input">{text("input_label")}</Label>
                    <Textarea id="asn1-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={text("input_placeholder")} className="min-h-[560px] font-mono text-sm" spellCheck={false} />
                </section>
                <section className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("nodes")}</div><div className="text-2xl font-bold">{result?.totalNodes ?? 0}</div></div>
                        <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("truncated")}</div><div className="text-2xl font-bold">{result?.truncated ? text("yes") : text("no")}</div></div>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                        <div className="grid grid-cols-[96px_120px_minmax(0,1fr)_96px] gap-3 border-b bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
                            <span>{text("offset")}</span>
                            <span>{text("tag")}</span>
                            <span>{text("value")}</span>
                            <span>{text("length")}</span>
                        </div>
                        <div className="max-h-[520px] overflow-auto">
                            {result?.nodes.length ? result.nodes.map((node) => <NodeView key={node.id} node={node} />) : <div className="p-4 text-sm text-muted-foreground">{text("empty_state")}</div>}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

