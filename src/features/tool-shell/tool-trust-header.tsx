"use client"

import { AlertTriangle, ExternalLink, Github, Info, LockKeyhole, ShieldCheck, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"
import type { ToolExternalDataSent, ToolNetworkAccess, ToolPrivacyManifest } from "@/core/registry/types"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"

type ToolTrustHeaderProps = {
    slug: string
    sourceUrl: string
    privacy: ToolPrivacyManifest
    networkAccess: ToolNetworkAccess
    networkHosts?: readonly string[]
    networkPurposeKey?: string | null
    externalDataSent?: ToolExternalDataSent | null
}

function StatusItem({
    icon,
    label,
    description,
    tone = "default",
}: {
    icon: React.ReactNode
    label: string
    description: string
    tone?: "default" | "warning" | "success"
}) {
    const iconClassName = tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "success"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-primary"

    return (
        <li className="flex min-w-0 gap-2.5">
            <span className={`mt-0.5 shrink-0 ${iconClassName}`} aria-hidden="true">
                {icon}
            </span>
            <span className="min-w-0">
                <span className="block text-sm font-medium leading-5 text-foreground">{label}</span>
                <span className="block text-xs leading-5 text-muted-foreground">{description}</span>
            </span>
        </li>
    )
}

function TrustLink({
    href,
    icon,
    label,
    external,
}: {
    href: string
    icon: React.ReactNode
    label: string
    external?: boolean
}) {
    return (
        <Link
            href={href}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
        >
            {icon}
            <span>{label}</span>
        </Link>
    )
}

export function ToolTrustHeader({
    slug,
    sourceUrl,
    privacy,
    networkAccess,
    networkHosts = [],
    networkPurposeKey,
    externalDataSent,
}: ToolTrustHeaderProps) {
    const { lang, t } = useLang()
    const copy = t.common.tool_trust_header
    const externalCopy = t.common.external_network_notice
    const isExternalRequest = privacy.executionMode === "external-request" || privacy.externalRequest.required || networkAccess !== "none"
    const hostList = networkHosts.length > 0
        ? networkHosts
        : privacy.externalRequest.domains ?? []
    const purpose = networkPurposeKey
        ? externalCopy.purposes?.[networkPurposeKey as keyof typeof externalCopy.purposes]
        : privacy.externalRequest.purposeKey
            ? externalCopy.purposes?.[privacy.externalRequest.purposeKey as keyof typeof externalCopy.purposes]
            : undefined
    const dataSent = externalDataSent
        ? externalCopy.external_data?.[externalDataSent as keyof typeof externalCopy.external_data]
        : privacy.externalRequest.userDataSent
            ? externalCopy.external_data?.[privacy.externalRequest.userDataSent as keyof typeof externalCopy.external_data]
            : undefined

    const runtimeLabel = isExternalRequest
        ? requireTranslationValue(copy.external_request_label, "common.tool_trust_header.external_request_label")
        : requireTranslationValue(copy.browser_local_label, "common.tool_trust_header.browser_local_label")
    const runtimeDescription = isExternalRequest
        ? requireTranslationValue(copy.external_request_desc, "common.tool_trust_header.external_request_desc")
        : requireTranslationValue(copy.browser_local_desc, "common.tool_trust_header.browser_local_desc")

    return (
        <section
            className="mb-4 rounded-xl border border-border/70 bg-card/65 px-4 py-4 shadow-sm"
            aria-labelledby={`tool-trust-${slug}`}
        >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p id={`tool-trust-${slug}`} className="text-sm font-semibold tracking-tight text-foreground">
                        {requireTranslationValue(copy.title, "common.tool_trust_header.title")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {runtimeDescription}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <TrustLink
                        href={sourceUrl}
                        external
                        icon={<Github className="h-4 w-4" aria-hidden="true" />}
                        label={requireTranslationValue(copy.github_label, "common.tool_trust_header.github_label")}
                    />
                    <TrustLink
                        href={`/${lang}/trust-center`}
                        icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                        label={requireTranslationValue(copy.trust_center_link, "common.tool_trust_header.trust_center_link")}
                    />
                    <TrustLink
                        href={`/${lang}/about#privacy`}
                        icon={<Info className="h-4 w-4" aria-hidden="true" />}
                        label={requireTranslationValue(copy.devtools_link, "common.tool_trust_header.devtools_link")}
                    />
                </div>
            </div>

            <ul className="mt-4 grid gap-x-5 gap-y-3 border-t border-border/65 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatusItem
                    tone={isExternalRequest ? "warning" : "success"}
                    icon={isExternalRequest ? <ExternalLink className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    label={runtimeLabel}
                    description={runtimeDescription}
                />
                <StatusItem
                    tone={privacy.offlineCapable ? "success" : "warning"}
                    icon={privacy.offlineCapable ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                    label={requireTranslationValue(copy.offline_label, "common.tool_trust_header.offline_label")}
                    description={requireTranslationValue(
                        privacy.offlineCapable ? copy.offline_desc : copy.network_required_desc,
                        privacy.offlineCapable
                            ? "common.tool_trust_header.offline_desc"
                            : "common.tool_trust_header.network_required_desc",
                    )}
                />
                <StatusItem
                    tone={privacy.sensitiveInput ? "warning" : "default"}
                    icon={privacy.sensitiveInput ? <LockKeyhole className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    label={requireTranslationValue(
                        privacy.sensitiveInput ? copy.sensitive_label : copy.standard_input_label,
                        privacy.sensitiveInput
                            ? "common.tool_trust_header.sensitive_label"
                            : "common.tool_trust_header.standard_input_label",
                    )}
                    description={requireTranslationValue(
                        privacy.sensitiveInput ? copy.sensitive_desc : copy.standard_input_desc,
                        privacy.sensitiveInput
                            ? "common.tool_trust_header.sensitive_desc"
                            : "common.tool_trust_header.standard_input_desc",
                    )}
                />
                <StatusItem
                    icon={<Info className="h-4 w-4" />}
                    label={requireTranslationValue(copy.devtools_label, "common.tool_trust_header.devtools_label")}
                    description={requireTranslationValue(copy.devtools_desc, "common.tool_trust_header.devtools_desc")}
                />
            </ul>

            {isExternalRequest ? (
                <div className="mt-4 border-t border-amber-500/30 pt-3 text-sm">
                    <div className="flex gap-2.5">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                        <div className="min-w-0">
                            <p className="font-medium text-foreground">
                                {requireTranslationValue(copy.external_details, "common.tool_trust_header.external_details")}
                            </p>
                            {privacy.externalRequest.disclosure ? (
                                <p className="mt-1 text-muted-foreground">{privacy.externalRequest.disclosure}</p>
                            ) : null}
                            {hostList.length > 0 ? (
                                <p className="mt-1 text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                        {requireTranslationValue(copy.endpoints_label, "common.tool_trust_header.endpoints_label")}:
                                    </span>{" "}
                                    <span className="font-mono text-xs">{hostList.join(", ")}</span>
                                </p>
                            ) : null}
                            {purpose ? (
                                <p className="mt-1 text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                        {requireTranslationValue(externalCopy.purpose_label, "common.external_network_notice.purpose_label")}:
                                    </span>{" "}
                                    {purpose}
                                </p>
                            ) : null}
                            {dataSent ? (
                                <p className="mt-1 text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                        {requireTranslationValue(copy.sent_data_label, "common.tool_trust_header.sent_data_label")}:
                                    </span>{" "}
                                    {dataSent}
                                </p>
                            ) : null}
                            {privacy.externalRequest.consentRequired ? (
                                <p className="mt-1 text-muted-foreground">
                                    {requireTranslationValue(copy.consent_label, "common.tool_trust_header.consent_label")}
                                </p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                                <Link
                                    href={`/${lang}/trust-center`}
                                    className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                    {requireTranslationValue(copy.trust_center_link, "common.tool_trust_header.trust_center_link")}
                                </Link>
                                <Link
                                    href={`/${lang}/privacy`}
                                    className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <Info className="h-4 w-4" aria-hidden="true" />
                                    {requireTranslationValue(copy.privacy_link, "common.tool_trust_header.privacy_link")}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    )
}
