"use client"

import { ExternalLink } from "lucide-react"
import type { ToolNetworkAccess } from "@/core/registry/types"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"

type ExternalNetworkNoticeProps = {
    networkAccess: ToolNetworkAccess
}

export function ExternalNetworkNotice({ networkAccess }: ExternalNetworkNoticeProps) {
    const { t } = useLang()

    if (networkAccess === "none") return null

    const labels = t.common.external_network_notice
    const message = networkAccess === "third_party_api"
        ? requireTranslationValue(labels.third_party_api_message, "common.external_network_notice.third_party_api_message")
        : requireTranslationValue(labels.user_requested_message, "common.external_network_notice.user_requested_message")

    return (
        <section className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
            <div className="flex gap-3">
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                    <p className="font-medium">
                        {requireTranslationValue(labels.title, "common.external_network_notice.title")}
                    </p>
                    <p className="mt-1 text-muted-foreground">{message}</p>
                </div>
            </div>
        </section>
    )
}
