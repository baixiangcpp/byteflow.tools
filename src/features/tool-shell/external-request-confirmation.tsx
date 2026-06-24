"use client"

import { ExternalLink, ShieldCheck } from "lucide-react"
import type { ToolExternalDataSent } from "@/core/registry/types"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"
import { Checkbox } from "@/components/ui/checkbox"

type ExternalRequestConfirmationProps = {
    hosts: readonly string[]
    purposeKey: string
    dataSent: ToolExternalDataSent
    confirmed: boolean
    onConfirmedChange: (confirmed: boolean) => void
    rightsGuidance?: string
}

export function ExternalRequestConfirmation({
    hosts,
    purposeKey,
    dataSent,
    confirmed,
    onConfirmedChange,
    rightsGuidance,
}: ExternalRequestConfirmationProps) {
    const { t } = useLang()
    const labels = t.common.external_network_notice
    const purpose = labels.purposes?.[purposeKey as keyof typeof labels.purposes]
    const dataSentLabel = labels.external_data?.[dataSent as keyof typeof labels.external_data]

    return (
        <section className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 text-sm" aria-labelledby="external-request-confirmation-title">
            <div className="flex items-start gap-2">
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-2">
                    <h2 id="external-request-confirmation-title" className="font-semibold text-foreground">
                        {requireTranslationValue(labels.confirm_title, "common.external_network_notice.confirm_title")}
                    </h2>
                    <div className="grid gap-1 text-xs text-muted-foreground">
                        <p>
                            <span className="font-medium text-foreground">{requireTranslationValue(labels.hosts_label, "common.external_network_notice.hosts_label")}:</span>{" "}
                            <span className="font-mono">{hosts.join(", ")}</span>
                        </p>
                        <p>
                            <span className="font-medium text-foreground">{requireTranslationValue(labels.purpose_label, "common.external_network_notice.purpose_label")}:</span>{" "}
                            {purpose}
                        </p>
                        <p>
                            <span className="font-medium text-foreground">{requireTranslationValue(labels.data_sent_label, "common.external_network_notice.data_sent_label")}:</span>{" "}
                            {dataSentLabel}
                        </p>
                    </div>
                    <p className="flex items-start gap-2 rounded-md border border-background/70 bg-background/65 p-2 text-xs text-muted-foreground">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        <span>{rightsGuidance || requireTranslationValue(labels.confirm_rights, "common.external_network_notice.confirm_rights")}</span>
                    </p>
                    <label className="flex items-start gap-2 rounded-md border border-background/70 bg-background/80 p-2 text-xs font-medium leading-relaxed text-foreground">
                        <Checkbox
                            checked={confirmed}
                            onCheckedChange={onConfirmedChange}
                            aria-label={requireTranslationValue(labels.confirm_checkbox, "common.external_network_notice.confirm_checkbox")}
                        />
                        <span>{requireTranslationValue(labels.confirm_checkbox, "common.external_network_notice.confirm_checkbox")}</span>
                    </label>
                </div>
            </div>
        </section>
    )
}
