"use client"

import * as React from "react"
import { Copy, Clock, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { parseTimestampHeuristic } from "@/features/tools/unix-timestamp/utils"
import { ToolPageContainer } from "@/components/layout/page-container"

export function UnixTimestampPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["unix_timestamp"] as Record<string, string>
    const [currentTimestamp, setCurrentTimestamp] = React.useState(0)
    const [inputTimestamp, setInputTimestamp] = React.useState<string>("")
    const [dateObj, setDateObj] = React.useState<Date | null>(null)
    const localFormatter = React.useMemo(
        () =>
            new Intl.DateTimeFormat(lang, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
            }),
        [lang],
    )
    const utcFormatter = React.useMemo(
        () =>
            new Intl.DateTimeFormat(lang, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                timeZone: "UTC",
                timeZoneName: "short",
            }),
        [lang],
    )

    // Auto-update current timestamp every second
    React.useEffect(() => {
        setCurrentTimestamp(Math.floor(Date.now() / 1000))
        const timer = setInterval(() => {
            setCurrentTimestamp(Math.floor(Date.now() / 1000))
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // Parse input timestamp
    React.useEffect(() => {
        if (!inputTimestamp) {
            setDateObj(null)
            return
        }

        const result = parseTimestampHeuristic(inputTimestamp)
        const date = result.date

        // Check if valid date
        if (isNaN(date.getTime())) {
            setDateObj(null)
        } else {
            setDateObj(date)
        }
    }, [inputTimestamp])

    const handleCopy = async (text: string, label: string) => {
        const result = await safeClipboardWrite(text)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, { description: label })
    }

    const handleUseCurrent = () => {
        setInputTimestamp(currentTimestamp.toString())
    }

    // Formatting helpers
    const formatLocal = (d: Date) => localFormatter.format(d)
    const formatUTC = (d: Date) => utcFormatter.format(d)
    const formatISO = (d: Date) => d.toISOString()
    const formatRelative = (d: Date, nowMs: number) => {
        const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" })
        const daysDifference = Math.round((d.getTime() - nowMs) / (1000 * 60 * 60 * 24))

        if (Math.abs(daysDifference) < 1) {
            const hoursDiff = Math.round((d.getTime() - nowMs) / (1000 * 60 * 60))
            if (Math.abs(hoursDiff) < 1) {
                const minsDiff = Math.round((d.getTime() - nowMs) / (1000 * 60))
                return rtf.format(minsDiff, "minute")
            }
            return rtf.format(hoursDiff, "hour")
        }
        return rtf.format(daysDifference, "day")
    }

    return (
        <ToolPageContainer className="flex flex-col h-full space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Clock className="h-6 w-6 text-primary" />
                        {toolT.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">

                {/* Input & Current Time Section */}
                <div className="flex flex-col space-y-6">

                    <div className="p-6 border rounded-lg bg-card text-center space-y-4 shadow-sm">
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{toolT.current_epoch_time}</h2>
                        <div className="text-5xl font-mono font-bold text-foreground">
                            {currentTimestamp}
                        </div>
                        <div className="flex justify-center gap-2 pt-2">
                            <Button variant="secondary" size="sm" onClick={() => void handleCopy(currentTimestamp.toString(), toolT.current_epoch_time)}>
                                <Copy className="mr-2 h-4 w-4" />{t.common.copy}</Button>
                            <Button variant="outline" size="sm" onClick={handleUseCurrent}>
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                {toolT.load_current}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4 p-6 border rounded-lg bg-card shadow-sm">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                {toolT.timestamp_input_label}
                            </label>
                            <Input
                                type="text"
                                className="font-mono text-lg h-12"
                                placeholder={toolT.timestamp_placeholder}
                                value={inputTimestamp}
                                onChange={(e) => setInputTimestamp(e.target.value.replace(/[^0-9]/g, ""))}
                                maxLength={14}
                            />
                        </div>
                    </div>

                </div>

                {/* Human Readable Output Section */}
                <div className="flex flex-col space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        {toolT.resolved_dates}
                    </h3>

                    {dateObj ? (
                        <div className="space-y-4">
                            <ResultBox label={toolT.local_time} value={formatLocal(dateObj)} onCopy={() => void handleCopy(formatLocal(dateObj), toolT.local_time)} copyPrefix={t.common.copy} />
                            <ResultBox label={toolT.utc_time} value={formatUTC(dateObj)} onCopy={() => void handleCopy(formatUTC(dateObj), toolT.utc_time)} copyPrefix={t.common.copy} />
                            <ResultBox label={toolT.iso_8601} value={formatISO(dateObj)} onCopy={() => void handleCopy(formatISO(dateObj), toolT.iso_8601)} copyPrefix={t.common.copy} />
                            <ResultBox label={toolT.relative_time} value={formatRelative(dateObj, currentTimestamp * 1000)} onCopy={() => void handleCopy(formatRelative(dateObj, currentTimestamp * 1000), toolT.relative_time)} copyPrefix={t.common.copy} />
                        </div>
                    ) : (
                        <div className="h-full border border-dashed rounded-lg flex items-center justify-center p-8 text-center text-muted-foreground bg-muted/10">
                            {inputTimestamp ? toolT.invalid_timestamp_format : toolT.empty_state}
                        </div>
                    )}

                </div>

            </div>
        </ToolPageContainer>
    )
}

function ResultBox({ label, value, onCopy, copyPrefix }: { label: string, value: string, onCopy: () => void, copyPrefix: string }) {
    return (
        <div className="flex flex-col space-y-1.5 p-3 rounded-md bg-muted/40 border">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-[22px] w-[22px]"
                    onClick={onCopy}
                    aria-label={`${copyPrefix} ${label}`}
                >
                    <Copy className="h-3 w-3" />
                    <span className="sr-only">{`${copyPrefix} ${label}`}</span>
                </Button>
            </div>
            <div className="font-mono text-sm text-foreground break-all">
                {value}
            </div>
        </div>
    )
}
