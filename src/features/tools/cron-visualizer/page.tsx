"use client"

import * as React from "react"
import { Clock, Copy, Calendar } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { ToolPageContainer } from "@/components/layout/page-container"

function parseCron(expr: string): { minute: string; hour: string; dom: string; month: string; dow: string } | null {
    const parts = expr.trim().split(/\s+/)
    if (parts.length !== 5) return null
    return { minute: parts[0], hour: parts[1], dom: parts[2], month: parts[3], dow: parts[4] }
}

function expandField(field: string, min: number, max: number): number[] {
    const results = new Set<number>()
    for (const part of field.split(",")) {
        const stepMatch = part.match(/^(.+)\/(\d+)$/)
        const step = stepMatch ? parseInt(stepMatch[2]) : 1
        const range = stepMatch ? stepMatch[1] : part

        if (range === "*") {
            for (let i = min; i <= max; i += step) results.add(i)
        } else if (range.includes("-")) {
            const [a, b] = range.split("-").map(Number)
            for (let i = a; i <= b; i += step) results.add(i)
        } else {
            results.add(parseInt(range))
        }
    }
    return [...results].filter(n => n >= min && n <= max).sort((a, b) => a - b)
}

function getNextExecutions(expr: string, count: number): Date[] {
    const cron = parseCron(expr)
    if (!cron) return []
    try {
        const minutes = expandField(cron.minute, 0, 59)
        const hours = expandField(cron.hour, 0, 23)
        const doms = cron.dom === "*" ? null : expandField(cron.dom, 1, 31)
        const months = cron.month === "*" ? null : expandField(cron.month, 1, 12)
        const dows = cron.dow === "*" ? null : expandField(cron.dow, 0, 6)

        const results: Date[] = []
        const now = new Date()
        const cursor = new Date(now)
        cursor.setSeconds(0, 0)
        cursor.setMinutes(cursor.getMinutes() + 1)

        let iterations = 0
        while (results.length < count && iterations < 525960) {
            iterations++
            const m = cursor.getMonth() + 1
            const d = cursor.getDate()
            const dow = cursor.getDay()
            const h = cursor.getHours()
            const min = cursor.getMinutes()

            if (months && !months.includes(m)) { cursor.setMinutes(cursor.getMinutes() + 1); continue }
            if (doms && !doms.includes(d)) { cursor.setMinutes(cursor.getMinutes() + 1); continue }
            if (dows && !dows.includes(dow)) { cursor.setMinutes(cursor.getMinutes() + 1); continue }
            if (!hours.includes(h)) { cursor.setMinutes(cursor.getMinutes() + 1); continue }
            if (!minutes.includes(min)) { cursor.setMinutes(cursor.getMinutes() + 1); continue }

            results.push(new Date(cursor))
            cursor.setMinutes(cursor.getMinutes() + 1)
        }
        return results
    } catch {
        return []
    }
}

export function CronVisualizerPage() {
    const { t, lang } = useLang()
    const [expr, setExpr] = React.useState("*/15 * * * *")
    const toolT = t.tools["cron_visualizer"] as Record<string, string>
    const [executions, setExecutions] = React.useState<Date[]>([])
    const [error, setError] = React.useState<string | null>(null)
    const [todayKey, setTodayKey] = React.useState("")
    const presets = React.useMemo(
        () => [
            { label: toolT.preset_every_minute, value: "* * * * *" },
            { label: toolT.preset_every_hour, value: "0 * * * *" },
            { label: toolT.preset_every_day_midnight, value: "0 0 * * *" },
            { label: toolT.preset_every_monday_9am, value: "0 9 * * 1" },
            { label: toolT.preset_every_15_minutes, value: "*/15 * * * *" },
            { label: toolT.preset_weekdays_6pm, value: "0 18 * * 1-5" },
            { label: toolT.preset_first_of_month, value: "0 0 1 * *" },
        ],
        [toolT],
    )

    React.useEffect(() => {
        if (!expr.trim()) { setExecutions([]); setError(null); return }
        const cron = parseCron(expr)
        if (!cron) { setError(toolT.invalid_expression); setExecutions([]); return }
        const next = getNextExecutions(expr, 20)
        setExecutions(next)
        setError(next.length === 0 ? toolT.no_executions : null)
    }, [expr, toolT.invalid_expression, toolT.no_executions])

    React.useEffect(() => {
        setTodayKey(new Date().toDateString())
    }, [])

    const handleCopyExpression = async () => {
        const result = await safeClipboardWrite(expr)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const cron = parseCron(expr)
    const fieldLabels = [
        toolT.minute,
        toolT.hour,
        toolT.dom,
        toolT.month,
        toolT.dow
    ]
    const fields = cron ? [cron.minute, cron.hour, cron.dom, cron.month, cron.dow] : []

    return (
        <ToolPageContainer className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b px-4 py-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">{toolT.title}</h1>
                        <p className="text-xs text-muted-foreground">{toolT.description}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => void handleCopyExpression()}>
                    <Copy className="h-3.5 w-3.5 mr-1" />{t.common.copy}</Button>
            </div>

            <div className="flex-1 flex min-h-0">
                {/* Left: Input & Fields */}
                <div className="w-[380px] border-r p-4 space-y-4 overflow-auto">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">{toolT.expression}</label>
                        <Input value={expr} onChange={(e) => setExpr(e.target.value)} className="font-mono text-base" placeholder="* * * * *" />
                        {error && <p className="text-xs text-destructive">{error}</p>}
                    </div>

                    {/* Field breakdown */}
                    {fields.length === 5 && (
                        <div className="grid grid-cols-5 gap-1.5">
                            {fields.map((f, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-lg font-mono font-bold text-primary">{f}</div>
                                    <div className="text-[10px] text-muted-foreground">{fieldLabels[i]}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Presets */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">{toolT.quick_presets}</label>
                        <div className="grid gap-1">
                            {presets.map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => setExpr(p.value)}
                                    className={`text-left px-2.5 py-1.5 rounded text-xs transition-colors ${expr === p.value ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground"}`}
                                >
                                    <span className="font-mono mr-2">{p.value}</span>
                                    <span className="opacity-70">{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Timeline */}
                <div className="flex-1 p-4 overflow-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {(toolT.next_executions).replace("{count}", executions.length.toString())}
                        </span>
                    </div>
                    <div className="space-y-1">
                        {executions.map((date, i) => {
                            const isToday = todayKey ? date.toDateString() === todayKey : false
                            return (
                                <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded hover:bg-muted/50 transition-colors">
                                    <div className="w-6 text-xs text-muted-foreground tabular-nums text-right">#{i + 1}</div>
                                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                    <div className="flex-1 font-mono text-sm">
                                        <span className={isToday ? "text-primary font-semibold" : "text-foreground"}>
                                            {date.toLocaleDateString(lang, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                        <span className="text-muted-foreground ml-2">
                                            {date.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit", hour12: false })}
                                        </span>
                                    </div>
                                    {isToday && <span className="text-[10px] text-primary font-medium px-1.5 py-0.5 rounded bg-primary/10">{toolT.today}</span>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </ToolPageContainer>
    )
}
