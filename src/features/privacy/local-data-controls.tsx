"use client"

import * as React from "react"
import Link from "next/link"
import { BarChart3, ShieldCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { isAnalyticsEnabled, isAnalyticsOptedOut, setAnalyticsOptOut } from "@/core/analytics/analytics"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"
import { clearByteflowLocalData } from "@/core/storage/tool-persistence-policy"

export function LocalDataControls() {
    const { t, lang } = useLang()
    const [message, setMessage] = React.useState<string | null>(null)
    const [analyticsOptedOut, setAnalyticsOptedOut] = React.useState(false)
    const labels = t.common.local_data_controls

    React.useEffect(() => {
        setAnalyticsOptedOut(isAnalyticsOptedOut())
    }, [])

    const clearData = () => {
        const removed = clearByteflowLocalData()
        setAnalyticsOptedOut(isAnalyticsOptedOut())
        if (removed === 0) {
            setMessage(requireTranslationValue(labels.none_found_message, "common.local_data_controls.none_found_message"))
            return
        }

        const messageTemplate = removed === 1
            ? requireTranslationValue(labels.cleared_one_message, "common.local_data_controls.cleared_one_message")
            : requireTranslationValue(labels.cleared_many_message, "common.local_data_controls.cleared_many_message")

        setMessage(messageTemplate.replace("{count}", String(removed)))
    }

    const updateAnalyticsOptOut = (checked: boolean | "indeterminate") => {
        const optedOut = checked === true
        setAnalyticsOptOut(optedOut)
        setAnalyticsOptedOut(optedOut)
        setMessage(optedOut
            ? requireTranslationValue(labels.analytics_opted_out_message, "common.local_data_controls.analytics_opted_out_message")
            : requireTranslationValue(labels.analytics_default_message, "common.local_data_controls.analytics_default_message"))
    }

    const analyticsEnabled = isAnalyticsEnabled()
    const analyticsStatus = analyticsEnabled && !analyticsOptedOut
        ? requireTranslationValue(labels.analytics_status_enabled, "common.local_data_controls.analytics_status_enabled")
        : analyticsOptedOut
            ? requireTranslationValue(labels.analytics_status_opted_out, "common.local_data_controls.analytics_status_opted_out")
            : requireTranslationValue(labels.analytics_status_disabled, "common.local_data_controls.analytics_status_disabled")

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/55 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {requireTranslationValue(labels.title, "common.local_data_controls.title")}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {requireTranslationValue(labels.description, "common.local_data_controls.description")}
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={clearData}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {requireTranslationValue(labels.clear_button, "common.local_data_controls.clear_button")}
                    </Button>
                </div>
                {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
            </div>
            <section className="rounded-2xl border border-border/70 bg-background/55 p-5" aria-labelledby="analytics-controls-title">
                <div>
                    <h2 id="analytics-controls-title" className="flex items-center gap-2 text-lg font-semibold">
                        <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
                        {requireTranslationValue(labels.analytics_title, "common.local_data_controls.analytics_title")}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {requireTranslationValue(labels.analytics_description, "common.local_data_controls.analytics_description")}
                    </p>
                </div>
                <div className="mt-4 rounded-lg border border-border/70 bg-card/45 p-3 text-sm">
                    <p>
                        <span className="font-medium">{requireTranslationValue(labels.analytics_status_label, "common.local_data_controls.analytics_status_label")}:</span>{" "}
                        {analyticsStatus}
                    </p>
                    <label className="mt-3 flex items-start gap-2 text-sm text-foreground">
                        <Checkbox
                            checked={analyticsOptedOut}
                            onCheckedChange={updateAnalyticsOptOut}
                            aria-label={requireTranslationValue(labels.analytics_opt_out_label, "common.local_data_controls.analytics_opt_out_label")}
                        />
                        <span>{requireTranslationValue(labels.analytics_opt_out_label, "common.local_data_controls.analytics_opt_out_label")}</span>
                    </label>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                    <div className="rounded-lg border border-border/70 bg-card/35 p-3">
                        <p className="font-medium text-foreground">{requireTranslationValue(labels.analytics_allowed_title, "common.local_data_controls.analytics_allowed_title")}</p>
                        <p className="mt-2 leading-relaxed">{requireTranslationValue(labels.analytics_allowed_events, "common.local_data_controls.analytics_allowed_events")}</p>
                        <p className="mt-2 leading-relaxed">{requireTranslationValue(labels.analytics_allowed_fields, "common.local_data_controls.analytics_allowed_fields")}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-card/35 p-3">
                        <p className="flex items-center gap-2 font-medium text-foreground">
                            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                            {requireTranslationValue(labels.analytics_never_title, "common.local_data_controls.analytics_never_title")}
                        </p>
                        <p className="mt-2 leading-relaxed">{requireTranslationValue(labels.analytics_never_fields, "common.local_data_controls.analytics_never_fields")}</p>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/${lang}/privacy`}>
                        {requireTranslationValue(labels.analytics_privacy_link, "common.local_data_controls.analytics_privacy_link")}
                    </Link>
                    <Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/${lang}/trust-center`}>
                        {requireTranslationValue(labels.analytics_trust_link, "common.local_data_controls.analytics_trust_link")}
                    </Link>
                </div>
            </section>
        </div>
    )
}
