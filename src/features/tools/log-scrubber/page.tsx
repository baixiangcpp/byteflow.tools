"use client"

import * as React from "react"
import { Copy, Eraser, FileText, ShieldCheck, Workflow } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { buildSensitiveToolHandoffLink } from "@/core/routing/tool-handoff"
import {
    DEFAULT_SCRUB_OPTIONS,
    scrubLogs,
    summarizeFindings,
    type ScrubFinding,
    type ScrubOptions,
} from "@/core/utils/log-scrubber-utils"
import { WideToolPageContainer } from "@/components/layout/page-container"

type OptionKey = keyof ScrubOptions

const OPTION_KEYS: OptionKey[] = [
    "emails",
    "ipAddresses",
    "jwtTokens",
    "bearerTokens",
    "apiKeys",
    "awsAccessKeys",
    "privateKeys",
    "urlCredentials",
    "cookies",
    "sessionIds",
]

export function LogScrubberPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["log_scrubber"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [findings, setFindings] = React.useState<ScrubFinding[]>([])
    const [options, setOptions] = React.useState<ScrubOptions>(DEFAULT_SCRUB_OPTIONS)

    const summary = React.useMemo(() => summarizeFindings(findings), [findings])
    const handoffPayload = output || input
    const pipelineHandoff = React.useMemo(
        () => buildSensitiveToolHandoffLink(lang, "pipeline-builder"),
        [lang],
    )

    const updateOption = React.useCallback((key: OptionKey, checked: boolean) => {
        setOptions((current) => ({ ...current, [key]: checked }))
    }, [])

    const runScrub = React.useCallback(() => {
        if (!input.trim()) {
            toast.error(t.common.input_required)
            return
        }

        const result = scrubLogs(input, options)
        setOutput(result.output)
        setFindings(result.findings)
        toast.success(text("scrubbed").replace("{count}", String(result.redactionCount)))
    }, [input, options, t.common.input_required, text])

    const copyOutput = React.useCallback(async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }, [output, t.common.copy_failed, t.common.copied])

    const loadExample = React.useCallback(() => {
        setInput(`2026-06-09T18:42:11Z ERROR login failed email=alice@example.com ip=203.0.113.42
Authorization: Bearer sk_live_1234567890abcdef
database_url=postgres://deploy:supersecret@db.example.com:5432/app
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature
password=hunter2`)
        setOutput("")
        setFindings([])
    }, [])

    const handleClear = React.useCallback(() => {
        setInput("")
        setOutput("")
        setFindings([])
        setOptions(DEFAULT_SCRUB_OPTIONS)
    }, [])

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: t.common.sample,
            icon: FileText,
            onClick: loadExample,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
            destructive: true,
        },
        {
            id: "run",
            label: text("scrub_action"),
            icon: ShieldCheck,
            onClick: runScrub,
            variant: "default",
            disabled: !input.trim(),
            disabledReason: t.common.action_disabled_input_required,
        },
        {
            id: "copy",
            label: t.common.copy,
            icon: Copy,
            onClick: copyOutput,
            disabled: !output,
            disabledReason: t.common.action_disabled_no_output,
        },
        {
            id: "to_pipeline_builder",
            label: (t.tools["pipeline_builder"] as Record<string, string> | undefined)?.title ?? "Pipeline Builder",
            icon: Workflow,
            href: pipelineHandoff.href,
            onClick: pipelineHandoff.prime,
            disabled: !handoffPayload.trim(),
            disabledReason: t.common.action_disabled_no_output,
        },
    ]

    return (
        <WideToolPageContainer className="flex flex-col gap-6 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">{text("description")}</p>
                </div>
                <ToolActionBar actions={actions} handoffPayload={handoffPayload} />
            </div>

            <SensitiveInputWarning variant="log" />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                        <Label>{text("input_label")}</Label>
                        <Textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder={text("input_placeholder")}
                            className="min-h-[440px] font-mono text-sm"
                        />
                    </div>
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

                <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                        <h2 className="text-sm font-semibold">{text("redaction_options")}</h2>
                        <div className="mt-3 space-y-3">
                            {OPTION_KEYS.map((key) => (
                                <label key={key} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={options[key]}
                                        onCheckedChange={(checked) => updateOption(key, checked)}
                                    />
                                    <span>{text(`option_${key}`)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border p-3">
                            <div className="text-xs text-muted-foreground">{text("redactions")}</div>
                            <div className="text-2xl font-bold">{findings.length}</div>
                        </div>
                        <div className="rounded-lg border p-3">
                            <div className="text-xs text-muted-foreground">{text("types")}</div>
                            <div className="text-2xl font-bold">{Object.keys(summary).length}</div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                        {text("manual_review_note")}
                    </div>
                    {Object.keys(summary).length > 0 && (
                        <div className="rounded-lg border p-4">
                            <h2 className="text-sm font-semibold">{text("summary_title")}</h2>
                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                                {Object.entries(summary).map(([type, count]) => (
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

            {findings.length > 0 && (
                <div className="overflow-hidden rounded-lg border">
                    <div className="border-b bg-muted px-4 py-2 text-sm font-semibold">{text("findings_title")}</div>
                    <div className="max-h-[360px] overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-background">
                                <tr className="border-b">
                                    <th className="px-4 py-2 text-left">{text("table_type")}</th>
                                    <th className="px-4 py-2 text-left">{text("table_position")}</th>
                                    <th className="px-4 py-2 text-left">{text("table_preview")}</th>
                                    <th className="px-4 py-2 text-left">{text("table_replacement")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {findings.map((finding, index) => (
                                    <tr key={`${finding.type}-${finding.line}-${finding.column}-${index}`} className="border-b last:border-b-0">
                                        <td className="px-4 py-2">{finding.label}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{finding.line}:{finding.column}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{finding.maskedPreview}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{finding.replacement}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </WideToolPageContainer>
    )
}
