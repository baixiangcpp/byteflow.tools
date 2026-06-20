"use client"

import { ExternalLink } from "lucide-react"
import type { ToolExternalDataSent, ToolNetworkAccess } from "@/core/registry/types"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"

type ExternalNetworkNoticeProps = {
    networkAccess: ToolNetworkAccess
    networkHosts?: readonly string[]
    networkPurposeKey?: string | null
    requiresExplicitUserAction?: boolean | null
    externalDataSent?: ToolExternalDataSent | null
    disclosure?: string | null
    consentRequired?: boolean | null
}

export function ExternalNetworkNotice({
    networkAccess,
    networkHosts = [],
    networkPurposeKey,
    requiresExplicitUserAction,
    externalDataSent,
    disclosure,
    consentRequired,
}: ExternalNetworkNoticeProps) {
    const { t } = useLang()

    if (networkAccess === "none") return null

    const labels = t.common.external_network_notice
    const baseMessage = networkAccess === "third_party_api"
        ? requireTranslationValue(labels.third_party_api_message, "common.external_network_notice.third_party_api_message")
        : requiresExplicitUserAction === false
            ? requireTranslationValue(labels.user_input_preview_message, "common.external_network_notice.user_input_preview_message")
            : requireTranslationValue(labels.user_requested_message, "common.external_network_notice.user_requested_message")
    const hostList = networkHosts.length > 0 ? networkHosts.join(", ") : null
    const purpose = networkPurposeKey
        ? labels.purposes?.[networkPurposeKey as keyof typeof labels.purposes]
        : undefined
    const externalDataLabel = externalDataSent
        ? labels.external_data?.[externalDataSent as keyof typeof labels.external_data]
        : undefined

    return (
        <section className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
            <div className="flex gap-3">
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                    <p className="font-medium">
                        {requireTranslationValue(labels.title, "common.external_network_notice.title")}
                    </p>
                    <p className="mt-1 text-muted-foreground">{baseMessage}</p>
                    {disclosure ? (
                        <p className="mt-1 text-muted-foreground">{disclosure}</p>
                    ) : null}
                    {hostList ? (
                        <p className="mt-1 text-muted-foreground">
                            <span className="font-medium text-foreground">
                                {requireTranslationValue(labels.hosts_label, "common.external_network_notice.hosts_label")}:
                            </span>{" "}
                            <span className="font-mono text-xs">{hostList}</span>
                        </p>
                    ) : null}
                    {purpose ? (
                        <p className="mt-1 text-muted-foreground">
                            <span className="font-medium text-foreground">
                                {requireTranslationValue(labels.purpose_label, "common.external_network_notice.purpose_label")}:
                            </span>{" "}
                            {purpose}
                        </p>
                    ) : null}
                    {externalDataLabel ? (
                        <p className="mt-1 text-muted-foreground">
                            <span className="font-medium text-foreground">
                                {requireTranslationValue(labels.data_sent_label, "common.external_network_notice.data_sent_label")}:
                            </span>{" "}
                            {externalDataLabel}
                        </p>
                    ) : null}
                    {consentRequired ? (
                        <p className="mt-1 text-muted-foreground">
                            {requireTranslationValue(labels.consent_required_message, "common.external_network_notice.consent_required_message")}
                        </p>
                    ) : null}
                </div>
            </div>
        </section>
    )
}
