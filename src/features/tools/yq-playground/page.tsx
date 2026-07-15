"use client"

import * as React from "react"
import { Copy, FileText, Play } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { runYqQuery, type YqInputFormat, type YqOutputFormat, type YqQueryResult } from "@/features/tools/yq-playground/utils"
import { WideToolPageContainer } from "@/components/layout/page-container"

export function YqPlaygroundPage() {
    const { t } = useLang()
    const toolT = t.tools["yq_playground"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [input, setInput] = React.useState("")
    const [query, setQuery] = React.useState(".service.image")
    const [inputFormat, setInputFormat] = React.useState<YqInputFormat>("yaml")
    const [outputFormat, setOutputFormat] = React.useState<YqOutputFormat>("yaml")
    const [result, setResult] = React.useState<YqQueryResult | null>(null)

    const run = React.useCallback(() => {
        if (!input.trim()) {
            toast.error(t.common.input_required)
            return
        }
        const next = runYqQuery(input, query, { inputFormat, outputFormat })
        setResult(next)
        if (next.error) toast.error(text("query_failed"))
        else toast.success(text("query_complete"))
    }, [input, inputFormat, outputFormat, query, t.common.input_required, text])

    const copyOutput = React.useCallback(async () => {
        if (!result?.output) return
        const copyResult = await safeClipboardWrite(result.output)
        if (!copyResult.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }, [result, t.common.copy_failed, t.common.copied])

    const loadExample = React.useCallback(() => {
        setInput(`service:
  image: nginx:1.27
  ports:
    - 80
    - 443
  env:
    LOG_LEVEL: info
workers:
  - name: api
    replicas: 2
  - name: queue
    replicas: 1`)
        setQuery(".workers[*].name | to_json")
        setInputFormat("yaml")
        setOutputFormat("yaml")
        setResult(null)
    }, [])

    return (
        <WideToolPageContainer className="flex flex-col gap-6 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{text("title")}</h1>
                    <p className="mt-1 text-muted-foreground">{text("description")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={loadExample}>
                        <FileText className="mr-2 h-4 w-4" />
                        {t.common.try_example}
                    </Button>
                    <Button size="sm" onClick={run}>
                        <Play className="mr-2 h-4 w-4" />
                        {text("run_query")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void copyOutput()} disabled={!result?.output}>
                        <Copy className="mr-2 h-4 w-4" />
                        {t.common.copy}
                    </Button>
                </div>
            </div>

            <Alert>
                <AlertDescription>{text("subset_note")}</AlertDescription>
            </Alert>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
                <div className="space-y-2">
                    <Label>{text("query_label")}</Label>
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="h-10 w-full rounded-md border bg-background px-3 font-mono text-sm"
                        placeholder=".items[*].name | to_json"
                    />
                </div>
                <div className="space-y-2">
                    <Label>{text("input_format")}</Label>
                    <Select value={inputFormat} onValueChange={(value) => setInputFormat(value as YqInputFormat)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="yaml">YAML</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>{text("output_format")}</Label>
                    <Select value={outputFormat} onValueChange={(value) => setOutputFormat(value as YqOutputFormat)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="yaml">YAML</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {result?.error && (
                <Alert variant="destructive">
                    <AlertDescription>{result.error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                    <Label>{text("input_label")}</Label>
                    <Textarea value={input} onChange={(event) => setInput(event.target.value)} className="min-h-[460px] font-mono text-sm" placeholder={text("input_placeholder")} />
                </div>
                <div className="space-y-2">
                    <Label>{text("output_label")}</Label>
                    <Textarea value={result?.output || ""} readOnly className="min-h-[460px] bg-muted font-mono text-sm" placeholder={text("output_placeholder")} />
                </div>
            </div>

            {result && !result.error && (
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">{text("documents")}</div>
                        <div className="text-2xl font-bold">{result.documents}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">{text("result_format")}</div>
                        <div className="text-2xl font-bold uppercase">{result.format}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">{text("warnings")}</div>
                        <div className="text-2xl font-bold">{result.warnings.length}</div>
                    </div>
                </div>
            )}
        </WideToolPageContainer>
    )
}
