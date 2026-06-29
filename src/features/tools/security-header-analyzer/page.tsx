"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Copy, Eraser, ShieldAlert, Sparkles, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { analyzeSecurityHeaders, formatSecurityHeaderReport, type HeaderStatus } from "@/features/tools/security-header-analyzer/utils"

const SAMPLE_HEADERS = `HTTP/2 200
content-security-policy: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'
strict-transport-security: max-age=31536000; includeSubDomains; preload
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
cross-origin-opener-policy: same-origin
cross-origin-resource-policy: same-origin`

const statusClasses: Record<HeaderStatus, string> = {
    pass: "border-emerald-400/50 bg-emerald-500/10 text-emerald-300",
    warn: "border-amber-400/50 bg-amber-500/10 text-amber-300",
    fail: "border-red-400/50 bg-red-500/10 text-red-300",
}

const statusIcons: Record<HeaderStatus, React.ComponentType<{ className?: string }>> = {
    pass: CheckCircle2,
    warn: AlertTriangle,
    fail: XCircle,
}

const FALLBACK_LABELS: Record<string, string> = {
    copy_report: "Copy report",
    header_input_hint: "Paste response headers only. Request or response bodies are not needed.",
    header_input_label: "HTTP response headers",
    header_input_placeholder: "HTTP/2 200\ncontent-security-policy: default-src 'self'; object-src 'none'\nstrict-transport-security: max-age=31536000; includeSubDomains",
    sample_action: "Sample",
    score_hint: "Warnings count as partial credit. Review each recommendation before changing production headers.",
    score_label: "Security Header Score",
}

export function SecurityHeaderAnalyzerPage() {
    const { t } = useLang()
    const toolT = t.tools["security_header_analyzer"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key] || FALLBACK_LABELS[key] || key, [toolT])

    const [input, setInput] = React.useState(SAMPLE_HEADERS)
    const summary = React.useMemo(() => analyzeSecurityHeaders(input), [input])
    const statusText: Record<HeaderStatus, string> = React.useMemo(
        () => ({
            pass: text("status_pass"),
            warn: text("status_warn"),
            fail: text("status_fail"),
        }),
        [text],
    )

    const handleCopyReport = React.useCallback(async () => {
        const report = formatSecurityHeaderReport(summary, {
            scoreTitle: text("score_label"),
            summaryStatus: statusText,
            sectionSummary: text("report_summary"),
            sectionValue: text("report_value"),
            sectionRecommendations: text("report_recommendations"),
        })
        const result = await safeClipboardWrite(report)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: text("copy_report"),
        })
    }, [summary, statusText, t.common, text])

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: text("sample_action"),
            icon: Sparkles,
            onClick: () => setInput(SAMPLE_HEADERS),
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: () => setInput(""),
        },
        {
            id: "copy_output",
            label: t.common.copy,
            icon: Copy,
            onClick: handleCopyReport,
        },
    ]

    return (
        <div className="flex h-full flex-col">
            <div className="border-b px-4 py-3">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-primary" />
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                {toolT.title}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                {toolT.description}
                            </p>
                        </div>
                    </div>
                    <ToolActionBar actions={actions} />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6">
                <SensitiveInputWarning variant="log" className="mx-auto mb-4 w-full max-w-6xl" />

                <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-5">
                    <section className="lg:col-span-2 space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            {text("header_input_label")}
                        </label>
                        <Textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder={text("header_input_placeholder")}
                            className="min-h-[460px] font-mono text-xs leading-relaxed"
                        />
                        <p className="text-xs text-muted-foreground">
                            {text("header_input_hint")}
                        </p>
                    </section>

                    <section className="lg:col-span-3 space-y-3">
                        <div className="rounded-xl border border-border/70 bg-card/50 p-4">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs text-primary">
                                    {text("score_label")}: {summary.score}/{summary.maxScore} ({summary.percentage}%)
                                </span>
                                <span className="rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                                    {statusText.pass} {summary.passCount}
                                </span>
                                <span className="rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                                    {statusText.warn} {summary.warnCount}
                                </span>
                                <span className="rounded-md border border-red-400/40 bg-red-500/10 px-2 py-1 text-xs text-red-300">
                                    {statusText.fail} {summary.failCount}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {text("score_hint")}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {summary.assessments.map((item) => {
                                const Icon = statusIcons[item.status]
                                return (
                                    <article key={item.key} className={`rounded-lg border p-3 ${statusClasses[item.status]}`}>
                                        <header className="mb-2 flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            <h2 className="text-sm font-semibold">{item.key}</h2>
                                            <span className="ml-auto text-xs uppercase tracking-wide">{statusText[item.status]}</span>
                                        </header>
                                        <p className="text-sm">{item.summary}</p>
                                        {item.value ? (
                                            <p className="mt-1 break-all font-mono text-xs opacity-90">
                                                {item.value}
                                            </p>
                                        ) : null}
                                        {item.recommendations.length > 0 ? (
                                            <ul className="mt-2 space-y-1">
                                                {item.recommendations.map((tip) => (
                                                    <li key={tip} className="list-disc ml-5 text-xs opacity-95">
                                                        {tip}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </article>
                                )
                            })}
                        </div>
                    </section>
                </div>

                <div className="mx-auto mt-6 w-full max-w-6xl">
                    <RelatedTools toolKey="security_header_analyzer" />
                </div>
            </div>
        </div>
    )
}
