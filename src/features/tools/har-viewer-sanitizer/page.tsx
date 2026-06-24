"use client"

import * as React from "react"
import { Copy, FileText, Play, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { DEFAULT_HAR_SANITIZE_OPTIONS, parseHarSummary, sanitizeHar, type HarParseResult, type HarSanitizeOptions, type HarSanitizeResult } from "@/features/tools/har-viewer-sanitizer/utils"

type OptionKey = keyof HarSanitizeOptions

const OPTION_KEYS: OptionKey[] = ["headers", "cookies", "queryStrings", "postData", "responseContent"]

export function HarViewerSanitizerPage() {
    const { t } = useLang()
    const toolT = t.tools["har_viewer_sanitizer"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [input, setInput] = React.useState("")
    const [summary, setSummary] = React.useState<HarParseResult | null>(null)
    const [sanitized, setSanitized] = React.useState<HarSanitizeResult | null>(null)
    const [options, setOptions] = React.useState<HarSanitizeOptions>(DEFAULT_HAR_SANITIZE_OPTIONS)

    const updateOption = React.useCallback((key: OptionKey, checked: boolean) => {
        setOptions((current) => ({ ...current, [key]: checked }))
    }, [])

    const parse = React.useCallback(() => {
        if (!input.trim()) {
            toast.error(t.common.input_required)
            return
        }
        const next = parseHarSummary(input)
        setSummary(next)
        if (next.error) toast.error(text("parse_failed"))
        else toast.success(text("parsed"))
    }, [input, t.common.input_required, text])

    const sanitize = React.useCallback(() => {
        if (!input.trim()) {
            toast.error(t.common.input_required)
            return
        }
        const next = sanitizeHar(input, options)
        setSanitized(next)
        setSummary(parseHarSummary(next.output || input))
        if (next.error) toast.error(text("sanitize_failed"))
        else toast.success(text("sanitized").replace("{count}", String(next.redactionCount)))
    }, [input, options, t.common.input_required, text])

    const copyOutput = React.useCallback(async () => {
        if (!sanitized?.output) return
        const result = await safeClipboardWrite(sanitized.output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }, [sanitized, t.common.copy_failed, t.common.copied])

    const loadExample = React.useCallback(() => {
        setInput(JSON.stringify({
            log: {
                entries: [{
                    startedDateTime: "2026-06-10T10:00:00.000Z",
                    time: 184,
                    request: {
                        method: "POST",
                        url: "https://api.example.com/users?token=secret&debug=1",
                        headers: [{ name: "Authorization", value: "Bearer secret" }],
                        cookies: [{ name: "session", value: "cookie-secret" }],
                        queryString: [{ name: "token", value: "secret" }],
                        postData: { mimeType: "application/json", text: "{\"password\":\"secret\"}" },
                    },
                    response: {
                        status: 200,
                        headers: [{ name: "Set-Cookie", value: "id=secret" }],
                        cookies: [{ name: "id", value: "secret" }],
                        content: { mimeType: "application/json", text: "{\"ok\":true}" },
                    },
                }],
            },
        }, null, 2))
        setSummary(null)
        setSanitized(null)
    }, [])

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{text("title")}</h1>
                    <p className="mt-1 text-muted-foreground">{text("description")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={loadExample}><FileText className="mr-2 h-4 w-4" />{t.common.try_example}</Button>
                    <Button variant="outline" size="sm" onClick={parse}><Play className="mr-2 h-4 w-4" />{text("parse_action")}</Button>
                    <Button size="sm" onClick={sanitize}><ShieldCheck className="mr-2 h-4 w-4" />{text("sanitize_action")}</Button>
                    <Button variant="outline" size="sm" onClick={() => void copyOutput()} disabled={!sanitized?.output}><Copy className="mr-2 h-4 w-4" />{t.common.copy}</Button>
                </div>
            </div>

            {(summary?.error || sanitized?.error) && (
                <Alert variant="destructive"><AlertDescription>{summary?.error || sanitized?.error}</AlertDescription></Alert>
            )}

            <SensitiveInputWarning variant="log" />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                        <Label>{text("input_label")}</Label>
                        <Textarea value={input} onChange={(event) => setInput(event.target.value)} className="min-h-[520px] font-mono text-sm" placeholder={text("input_placeholder")} />
                    </div>
                    <div className="space-y-2">
                        <Label>{text("output_label")}</Label>
                        <Textarea value={sanitized?.output || ""} readOnly className="min-h-[520px] bg-muted font-mono text-sm" placeholder={text("output_placeholder")} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                        <h2 className="text-sm font-semibold">{text("sanitize_options")}</h2>
                        <div className="mt-3 space-y-3">
                            {OPTION_KEYS.map((key) => (
                                <label key={key} className="flex items-center gap-2 text-sm">
                                    <Checkbox checked={options[key]} onCheckedChange={(checked) => updateOption(key, checked)} />
                                    <span>{text(`option_${key}`)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("requests")}</div><div className="text-2xl font-bold">{summary?.totalRequests ?? 0}</div></div>
                        <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("redactions")}</div><div className="text-2xl font-bold">{sanitized?.redactionCount ?? 0}</div></div>
                    </div>
                    <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                        {text("review_warning")}
                    </div>
                    {sanitized && Object.keys(sanitized.summary).length > 0 && (
                        <div className="rounded-lg border p-4">
                            <h2 className="text-sm font-semibold">{text("summary_title")}</h2>
                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                                {Object.entries(sanitized.summary).map(([type, count]) => (
                                    <li key={type} className="flex items-center justify-between gap-3">
                                        <span className="font-mono text-xs">{type}</span>
                                        <span className="font-semibold text-foreground">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {summary && summary.entries.length > 0 && (
                <div className="overflow-hidden rounded-lg border">
                    <div className="border-b bg-muted px-4 py-2 text-sm font-semibold">{text("entries_title")}</div>
                    <div className="max-h-[360px] overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-background"><tr className="border-b"><th className="px-4 py-2 text-left">#</th><th className="px-4 py-2 text-left">{text("method")}</th><th className="px-4 py-2 text-left">{text("status")}</th><th className="px-4 py-2 text-left">URL</th><th className="px-4 py-2 text-left">{text("time")}</th></tr></thead>
                            <tbody>
                                {summary.entries.slice(0, 200).map((entry) => (
                                    <tr key={entry.index} className="border-b last:border-b-0">
                                        <td className="px-4 py-2 font-mono text-xs">{entry.index + 1}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{entry.method}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{entry.status}</td>
                                        <td className="max-w-[620px] truncate px-4 py-2 font-mono text-xs">{entry.url}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{entry.time} ms</td>
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
