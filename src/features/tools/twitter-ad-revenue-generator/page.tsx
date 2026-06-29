"use client"

import * as React from "react"
import { BarChart3, Copy, Download, Eraser, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    buildTwitterRevenueSeries,
    normalizeTwitterRevenueInput,
    seriesToCsv,
    summarizeTwitterRevenue,
    type TwitterRevenueInput,
} from "@/features/tools/twitter-ad-revenue-generator/utils"

const SAMPLE: TwitterRevenueInput = {
    impressionsPerDay: 220_000,
    cpmUsd: 6.5,
    ctrPercent: 1.4,
    cpcUsd: 0.32,
    fillRatePercent: 78,
    growthPercentPerDay: 1.5,
    days: 30,
}

function toCsvDownload(csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = objectUrl
    anchor.download = "twitter-revenue-forecast.csv"
    anchor.click()
    URL.revokeObjectURL(objectUrl)
}

export function TwitterAdRevenueGeneratorPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["twitter_ad_revenue_generator"] as Record<string, string>
    const integerFormatter = React.useMemo(() => new Intl.NumberFormat(lang), [lang])
    const usdFormatter = React.useMemo(
        () =>
            new Intl.NumberFormat(lang, {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        [lang],
    )
    const formatInteger = React.useCallback((value: number) => integerFormatter.format(value), [integerFormatter])
    const formatUsd = React.useCallback((value: number) => usdFormatter.format(value), [usdFormatter])

    const [input, setInput] = React.useState<TwitterRevenueInput>(SAMPLE)
    const safe = React.useMemo(() => normalizeTwitterRevenueInput(input), [input])
    const series = React.useMemo(() => buildTwitterRevenueSeries(safe), [safe])
    const summary = React.useMemo(() => summarizeTwitterRevenue(series), [series])
    const csv = React.useMemo(() => seriesToCsv(series), [series])

    const chartPoints = React.useMemo(() => series.slice(0, 14), [series])
    const maxRevenue = React.useMemo(
        () => Math.max(1, ...chartPoints.map((point) => point.totalRevenueUsd)),
        [chartPoints],
    )

    const output = React.useMemo(
        () =>
            [
                `${toolT.field_forecast_days}: ${formatInteger(safe.days)}`,
                `${toolT.field_impressions_day}: ${formatInteger(safe.impressionsPerDay)}`,
                `${toolT.field_cpm_usd}: ${safe.cpmUsd}`,
                `${toolT.field_ctr_percent}: ${safe.ctrPercent}`,
                `${toolT.field_cpc_usd}: ${safe.cpcUsd}`,
                `${toolT.field_fill_rate_percent}: ${safe.fillRatePercent}`,
                `${toolT.field_growth_day_percent}: ${safe.growthPercentPerDay}`,
                "",
                `${toolT.metric_total_impressions}: ${formatInteger(summary.totalImpressions)}`,
                `${toolT.metric_estimated_revenue}: ${formatUsd(summary.totalRevenueUsd)}`,
                `${toolT.metric_avg_daily_revenue}: ${formatUsd(summary.averageDailyRevenueUsd)}`,
                `${toolT.metric_estimated_clicks}: ${formatInteger(summary.estimatedClicks)}`,
                `${toolT.metric_erpm}: ${formatUsd(summary.eRPMUsd)}`,
            ].join("\n"),
        [formatInteger, formatUsd, safe, summary, toolT],
    )

    const setField = <K extends keyof TwitterRevenueInput>(key: K, value: number) => {
        setInput((prev) => ({ ...prev, [key]: value }))
    }

    const handleSample = () => setInput(SAMPLE)
    const handleReset = () =>
        setInput({
            impressionsPerDay: 100_000,
            cpmUsd: 5,
            ctrPercent: 1,
            cpcUsd: 0.25,
            fillRatePercent: 75,
            growthPercentPerDay: 0,
            days: 30,
        })

    const handleCopy = async () => {
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const handleDownload = () => {
        toCsvDownload(csv)
        toast.success(t.common.csv_downloaded)
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.revenue_inputs}</div>
                        <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
                            <NumberField label={toolT.field_impressions_day} value={input.impressionsPerDay} min={100} max={100000000} step={100} onChange={(v) => setField("impressionsPerDay", v)} />
                            <NumberField label={toolT.field_cpm_usd} value={input.cpmUsd} min={0} max={200} step={0.1} onChange={(v) => setField("cpmUsd", v)} />
                            <NumberField label={toolT.field_ctr_percent} value={input.ctrPercent} min={0} max={100} step={0.1} onChange={(v) => setField("ctrPercent", v)} />
                            <NumberField label={toolT.field_cpc_usd} value={input.cpcUsd} min={0} max={100} step={0.01} onChange={(v) => setField("cpcUsd", v)} />
                            <NumberField label={toolT.field_fill_rate_percent} value={input.fillRatePercent} min={0} max={100} step={0.5} onChange={(v) => setField("fillRatePercent", v)} />
                            <NumberField label={toolT.field_growth_day_percent} value={input.growthPercentPerDay} min={-50} max={100} step={0.1} onChange={(v) => setField("growthPercentPerDay", v)} />
                            <NumberField label={toolT.field_forecast_days} value={input.days} min={1} max={365} step={1} onChange={(v) => setField("days", v)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <MetricCard label={toolT.metric_estimated_revenue} value={formatUsd(summary.totalRevenueUsd)} />
                        <MetricCard label={toolT.metric_avg_daily_revenue} value={formatUsd(summary.averageDailyRevenueUsd)} />
                        <MetricCard label={toolT.metric_total_impressions} value={summary.totalImpressions.toLocaleString(lang)} />
                        <MetricCard label={toolT.metric_erpm} value={formatUsd(summary.eRPMUsd)} />
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{t.common.chart_summary}</span>
                    </div>
                    <div className="space-y-3 border-b bg-background/30 p-3">
                        <div className="rounded-lg border bg-background p-3">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.chart_revenue_trend_first_14_days}</div>
                            <div className="flex h-36 items-end gap-1">
                                {chartPoints.map((point) => {
                                    const height = Math.max(6, Math.round((point.totalRevenueUsd / maxRevenue) * 132))
                                    return (
                                        <div
                                            key={point.day}
                                            title={`${point.day}: ${formatUsd(point.totalRevenueUsd)}`}
                                            className="flex-1 rounded-sm bg-primary/70"
                                            style={{ height }}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[260px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function NumberField({
    label,
    value,
    min,
    max,
    step,
    onChange,
}: {
    label: string
    value: number
    min: number
    max: number
    step: number
    onChange: (value: number) => void
}) {
    return (
        <label className="space-y-1.5 rounded-lg border bg-background/70 p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            <Input
                type="number"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </label>
    )
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-background/60 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
        </div>
    )
}
