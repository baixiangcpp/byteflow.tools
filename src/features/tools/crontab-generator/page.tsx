"use client"

import * as React from "react"
import { Copy, CalendarClock, Eraser } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import type { Locale } from "@/core/i18n/i18n"
import cronstrue from "cronstrue/i18n.js"

const CRONSTRUE_LOCALE_BY_LANG: Record<Locale, string> = {
    en: "en",
    "zh-CN": "zh_CN",
    "zh-TW": "zh_TW",
    ja: "ja",
    ko: "ko",
    de: "de",
    fr: "fr",
}

export function CrontabGeneratorPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["crontab_generator"] as Record<string, string>
    const cronLocale = CRONSTRUE_LOCALE_BY_LANG[lang]
    const presets = [
        { label: toolT.preset_every_minute, value: "* * * * *" },
        { label: toolT.preset_every_hour, value: "0 * * * *" },
        { label: toolT.preset_every_day_midnight, value: "0 0 * * *" },
        { label: toolT.preset_every_sunday, value: "0 0 * * 0" },
        { label: toolT.preset_every_monday_9am, value: "0 9 * * 1" },
        { label: toolT.preset_every_month_first, value: "0 0 1 * *" },
    ]
    const [cronString, setCronString] = React.useState("* * * * *")
    const [description, setDescription] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)

    // Parse the cron string to parts
    const parts = cronString.split(" ")
    const pMinute = parts[0] || ""
    const pHour = parts[1] || ""
    const pDom = parts[2] || ""
    const pMonth = parts[3] || ""
    const pDow = parts[4] || ""

    React.useEffect(() => {
        if (!cronString.trim()) {
            setDescription("")
            setError(null)
            return
        }

        try {
            // Validate length roughly
            const parts = cronString.trim().split(/\s+/)
            if (parts.length < 5 || parts.length > 6) {
                throw new Error(toolT.invalid_expression)
            }

            const humanReadable = cronstrue.toString(cronString, {
                use24HourTimeFormat: true,
                locale: cronLocale,
            })
            setDescription(humanReadable)
            setError(null)
        } catch {
            setDescription("")
            setError(toolT.invalid_expression)
        }
    }, [cronLocale, cronString, toolT.invalid_expression])

    const handleCopy = async () => {
        if (!cronString || error) return
        const result = await safeClipboardWrite(cronString)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: toolT.copy_expression_success,
        })
    }

    const handleClear = () => {
        setCronString("* * * * *")
    }

    const updatePart = (index: number, val: string) => {
        const p = cronString.split(" ")
        // Fill array if too short
        while (p.length < 5) p.push("*")

        p[index] = val || "*"
        setCronString(p.slice(0, 5).join(" "))
    }

    return (
        <div className="flex flex-col h-full space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <CalendarClock className="h-6 w-6 text-primary" />
                        {t.tools['crontab_generator'].title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t.tools['crontab_generator'].description}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleClear}>
                        <Eraser className="mr-2 h-4 w-4" />
                        {toolT.reset_default}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">

                {/* Output Section */}
                <div className="flex flex-col border rounded-xl bg-card overflow-hidden shadow-sm relative">
                    <div className="p-8 pb-4 flex flex-col items-center justify-center gap-6">

                        <div className={`font-mono text-4xl sm:text-5xl md:text-6xl text-foreground font-bold tracking-widest text-center uppercase ${error ? 'text-destructive/80' : ''}`}>
                            {cronString}
                        </div>

                        <div className={`text-xl sm:text-2xl font-medium text-center h-12 flex items-center justify-center px-4 ${error ? 'text-destructive' : 'text-primary'}`}>
                            {error ? error : description}
                        </div>

                    </div>

                    <div className="px-4 py-3 bg-muted/40 border-t flex justify-center sm:justify-end items-center gap-2">
                        <Button size="sm" onClick={() => void handleCopy()} disabled={!!error}>
                            <Copy className="mr-2 h-4 w-4" />
                            {toolT.copy_expression}
                        </Button>
                    </div>
                </div>

                {/* Editor Grid */}
                <div className="grid grid-cols-5 gap-2 sm:gap-4 md:px-0">
                    <CronPartInput label={toolT.field_minute} value={pMinute} onChange={(v) => updatePart(0, v)} hint={toolT.hint_minute} />
                    <CronPartInput label={toolT.field_hour} value={pHour} onChange={(v) => updatePart(1, v)} hint={toolT.hint_hour} />
                    <CronPartInput label={toolT.field_day_month} value={pDom} onChange={(v) => updatePart(2, v)} hint={toolT.hint_day_month} />
                    <CronPartInput label={toolT.field_month} value={pMonth} onChange={(v) => updatePart(3, v)} hint={toolT.hint_month} />
                    <CronPartInput label={toolT.field_day_week} value={pDow} onChange={(v) => updatePart(4, v)} hint={toolT.hint_day_week} />
                </div>

                <div className="space-y-2 mt-4">
                    <label className="text-sm font-medium leading-none mb-3 block">
                        {toolT.raw_expression_input}
                    </label>
                    <Input
                        aria-label={toolT.raw_expression_input}
                        value={cronString}
                        onChange={(e) => setCronString(e.target.value)}
                        className={`font-mono text-lg h-12 text-center tracking-widest ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                </div>

                {/* Presets */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.preset_heading}</h3>
                    <div className="flex flex-wrap gap-3">
                        {presets.map((preset, index) => (
                            <Button
                                key={index}
                                variant="secondary"
                                className="text-sm"
                                onClick={() => setCronString(preset.value)}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

function CronPartInput({ label, value, hint, onChange }: { label: string, value: string, hint: string, onChange: (v: string) => void }) {
    return (
        <div className="flex flex-col space-y-2 text-center">
            <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block">
                {label}
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:hidden truncate px-1">
                {label}
            </label>
            <Input
                aria-label={label}
                type="text"
                className="font-mono text-center text-lg sm:text-xl h-12 sm:h-14 px-1"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <span className="text-[10px] text-muted-foreground hidden sm:block">
                {hint}
            </span>
        </div>
    )
}
