"use client"

import * as React from "react"
import { Copy, FileText, GitMerge, Play } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { runYamlExplorer, type YamlExplorerMode, type YamlExplorerResult } from "@/features/tools/yaml-merge-patch-explorer/utils"

export function YamlMergePatchExplorerPage() {
    const { t } = useLang()
    const toolT = t.tools["yaml_merge_patch_explorer"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [mode, setMode] = React.useState<YamlExplorerMode>("merge-documents")
    const [input, setInput] = React.useState("")
    const [patchInput, setPatchInput] = React.useState("")
    const [result, setResult] = React.useState<YamlExplorerResult | null>(null)

    const run = React.useCallback(() => {
        if (!input.trim()) {
            toast.error(t.common.input_required)
            return
        }
        if (mode === "merge-patch" && !patchInput.trim()) {
            toast.error(text("patch_required"))
            return
        }

        const nextResult = runYamlExplorer(input, patchInput, mode)
        setResult(nextResult)
        if (nextResult.error) {
            toast.error(text("parse_failed"))
        } else {
            toast.success(text("processed"))
        }
    }, [input, mode, patchInput, t.common.input_required, text])

    const output = result?.output || ""

    const copyOutput = React.useCallback(async () => {
        if (!output) return
        const copyResult = await safeClipboardWrite(output)
        if (!copyResult.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }, [output, t.common.copy_failed, t.common.copied])

    const loadExample = React.useCallback(() => {
        if (mode === "merge-documents") {
            setInput(`service:
  image: nginx:1.27
  ports:
    - 80
  env:
    LOG_LEVEL: info
---
service:
  ports:
    - 443
  env:
    FEATURE_FLAG: "on"
replicas: 2`)
            setPatchInput("")
        } else {
            setInput(`service:
  image: nginx:1.27
  debug: true
  env:
    LOG_LEVEL: info`)
            setPatchInput(`service:
  debug: null
  replicas: 2
  env:
    LOG_LEVEL: warn`)
        }
        setResult(null)
    }, [mode])

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <GitMerge className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">{text("description")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={loadExample}>
                        <FileText className="mr-2 h-4 w-4" />
                        {t.common.try_example}
                    </Button>
                    <Button size="sm" onClick={run}>
                        <Play className="mr-2 h-4 w-4" />
                        {text("run_action")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void copyOutput()} disabled={!output}>
                        <Copy className="mr-2 h-4 w-4" />
                        {t.common.copy}
                    </Button>
                </div>
            </div>

            <div className="max-w-sm space-y-2">
                <Label>{text("mode_label")}</Label>
                <Select value={mode} onValueChange={(value) => { setMode(value as YamlExplorerMode); setResult(null) }}>
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="merge-documents">{text("mode_merge_documents")}</SelectItem>
                        <SelectItem value="merge-patch">{text("mode_merge_patch")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {result?.error && (
                <Alert variant="destructive">
                    <AlertDescription>{result.error}</AlertDescription>
                </Alert>
            )}

            <div className={`grid gap-4 ${mode === "merge-patch" ? "xl:grid-cols-3" : "lg:grid-cols-2"}`}>
                <div className="space-y-2">
                    <Label>{mode === "merge-patch" ? text("base_yaml") : text("documents_yaml")}</Label>
                    <Textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder={mode === "merge-patch" ? text("base_placeholder") : text("documents_placeholder")}
                        className="min-h-[440px] font-mono text-sm"
                    />
                </div>
                {mode === "merge-patch" && (
                    <div className="space-y-2">
                        <Label>{text("patch_yaml")}</Label>
                        <Textarea
                            value={patchInput}
                            onChange={(event) => setPatchInput(event.target.value)}
                            placeholder={text("patch_placeholder")}
                            className="min-h-[440px] font-mono text-sm"
                        />
                    </div>
                )}
                <div className="space-y-2">
                    <Label>{text("output_label")}</Label>
                    <Textarea
                        value={output}
                        readOnly
                        placeholder={text("output_placeholder")}
                        className="min-h-[440px] bg-muted font-mono text-sm"
                    />
                </div>
            </div>

            {result && !result.error && (
                <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                        <div className="rounded-lg border p-3">
                            <div className="text-xs text-muted-foreground">{text("documents")}</div>
                            <div className="text-2xl font-bold">{result.documentCount}</div>
                        </div>
                        <div className="rounded-lg border p-3">
                            <div className="text-xs text-muted-foreground">{text("changes")}</div>
                            <div className="text-2xl font-bold">{result.changes.length}</div>
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                        <div className="border-b bg-muted px-4 py-2 text-sm font-semibold">{text("changes_title")}</div>
                        <div className="max-h-[320px] overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-background">
                                    <tr className="border-b">
                                        <th className="px-4 py-2 text-left">{text("table_path")}</th>
                                        <th className="px-4 py-2 text-left">{text("table_type")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.changes.length === 0 ? (
                                        <tr>
                                            <td className="px-4 py-3 text-muted-foreground" colSpan={2}>{text("no_changes")}</td>
                                        </tr>
                                    ) : result.changes.map((change) => (
                                        <tr key={`${change.type}-${change.path}`} className="border-b last:border-b-0">
                                            <td className="px-4 py-2 font-mono text-xs">{change.path}</td>
                                            <td className="px-4 py-2">{text(`change_${change.type}`)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
