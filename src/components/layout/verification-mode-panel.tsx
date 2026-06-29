"use client"

import * as React from "react"
import Link from "next/link"
import { Activity, Database, ShieldCheck, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"
import {
    getToolSlugFromVerificationPathname,
    getVerificationRequestMethod,
    isAllowedVerificationStorageKey,
    sanitizeVerificationUrl,
    type VerificationNetworkEntry,
    type VerificationStorageEntry,
} from "@/core/trust/verification-mode"
import { getRouteToolBySlug } from "@/generated/route-tool-lookup"

type VerificationModePanelProps = {
    pathname: string
}

const MAX_LOG_ENTRIES = 24

function formatTime(timestamp: string) {
    try {
        return new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(new Date(timestamp))
    } catch {
        return timestamp
    }
}

function appendEntry<T extends { id: number }>(entries: T[], entry: T) {
    return [entry, ...entries].slice(0, MAX_LOG_ENTRIES)
}

export function VerificationModePanel({ pathname }: VerificationModePanelProps) {
    const { lang, t } = useLang()
    const [enabled, setEnabled] = React.useState(false)
    const [expanded, setExpanded] = React.useState(false)
    const [networkLog, setNetworkLog] = React.useState<VerificationNetworkEntry[]>([])
    const [storageLog, setStorageLog] = React.useState<VerificationStorageEntry[]>([])
    const entryIdRef = React.useRef(0)
    const slug = getToolSlugFromVerificationPathname(pathname)
    const tool = slug ? getRouteToolBySlug(slug) : undefined
    const copy = React.useMemo(() => ({
        ariaLabel: requireTranslationValue(t.pages.verification_mode_aria_label, "pages.verification_mode_aria_label"),
        title: requireTranslationValue(t.pages.verification_mode_title, "pages.verification_mode_title"),
        description: requireTranslationValue(t.pages.verification_mode_description, "pages.verification_mode_description"),
        scope: requireTranslationValue(t.pages.verification_mode_scope, "pages.verification_mode_scope"),
        on: requireTranslationValue(t.pages.verification_mode_on, "pages.verification_mode_on"),
        off: requireTranslationValue(t.pages.verification_mode_off, "pages.verification_mode_off"),
        browserLocalTool: requireTranslationValue(t.pages.verification_mode_browser_local_tool, "pages.verification_mode_browser_local_tool"),
        externalRequestTool: requireTranslationValue(t.pages.verification_mode_external_request_tool, "pages.verification_mode_external_request_tool"),
        declaredHosts: requireTranslationValue(t.pages.verification_mode_declared_hosts, "pages.verification_mode_declared_hosts"),
        noneDeclared: requireTranslationValue(t.pages.verification_mode_none_declared, "pages.verification_mode_none_declared"),
        requestObserved: requireTranslationValue(t.pages.verification_mode_request_observed, "pages.verification_mode_request_observed"),
        requestsObserved: requireTranslationValue(t.pages.verification_mode_requests_observed, "pages.verification_mode_requests_observed"),
        externalHosts: requireTranslationValue(t.pages.verification_mode_external_hosts, "pages.verification_mode_external_hosts"),
        noExternalHosts: requireTranslationValue(t.pages.verification_mode_no_external_hosts, "pages.verification_mode_no_external_hosts"),
        storageKeysObserved: requireTranslationValue(t.pages.verification_mode_storage_keys_observed, "pages.verification_mode_storage_keys_observed"),
        noStorageChanges: requireTranslationValue(t.pages.verification_mode_no_storage_changes, "pages.verification_mode_no_storage_changes"),
        storageAllowed: requireTranslationValue(t.pages.verification_mode_storage_allowed, "pages.verification_mode_storage_allowed"),
        storageReview: requireTranslationValue(t.pages.verification_mode_storage_review, "pages.verification_mode_storage_review"),
        trustCenterLink: requireTranslationValue(t.pages.verification_mode_trust_center_link, "pages.verification_mode_trust_center_link"),
        clearLog: requireTranslationValue(t.pages.verification_mode_clear_log, "pages.verification_mode_clear_log"),
        enabledStatus: requireTranslationValue(t.pages.verification_mode_enabled_status, "pages.verification_mode_enabled_status"),
        disabledStatus: requireTranslationValue(t.pages.verification_mode_disabled_status, "pages.verification_mode_disabled_status"),
        close: requireTranslationValue(t.common.close, "common.close"),
    }), [t.common.close, t.pages])
    const externalHosts = React.useMemo(
        () => [...new Set(networkLog.filter((entry) => entry.pathType === "external").map((entry) => entry.host))].sort(),
        [networkLog],
    )

    React.useEffect(() => {
        setNetworkLog([])
        setStorageLog([])
        setExpanded(false)
    }, [pathname])

    React.useEffect(() => {
        if (!enabled || !tool || typeof window === "undefined") return

        const originalFetch = window.fetch
        const originalSendBeacon = navigator.sendBeacon?.bind(navigator)
        const originalLocalSetItem = Storage.prototype.setItem
        const originalLocalRemoveItem = Storage.prototype.removeItem
        const originalLocalClear = Storage.prototype.clear

        const nextId = () => {
            entryIdRef.current += 1
            return entryIdRef.current
        }

        const recordNetwork = (input: unknown, method: string) => {
            const sanitized = sanitizeVerificationUrl(input, window.location.href)
            setNetworkLog((current) => appendEntry(current, {
                id: nextId(),
                method,
                host: sanitized.host,
                pathType: sanitized.pathType,
                timestamp: new Date().toISOString(),
            }))
        }

        const recordStorage = (
            storage: Storage,
            operation: VerificationStorageEntry["operation"],
            key: string,
        ) => {
            const area = storage === window.sessionStorage ? "sessionStorage" : "localStorage"
            setStorageLog((current) => appendEntry(current, {
                id: nextId(),
                area,
                operation,
                key,
                allowed: key === "*" ? true : isAllowedVerificationStorageKey(key),
                timestamp: new Date().toISOString(),
            }))
        }

        window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
            recordNetwork(input, getVerificationRequestMethod(input, init))
            return originalFetch(input, init)
        }) as typeof window.fetch

        if (originalSendBeacon) {
            navigator.sendBeacon = ((url: string | URL, data?: BodyInit | null) => {
                recordNetwork(url, "BEACON")
                return originalSendBeacon(url, data)
            }) as typeof navigator.sendBeacon
        }

        Storage.prototype.setItem = function setItem(key: string, value: string) {
            recordStorage(this, "setItem", key)
            return originalLocalSetItem.call(this, key, value)
        }
        Storage.prototype.removeItem = function removeItem(key: string) {
            recordStorage(this, "removeItem", key)
            return originalLocalRemoveItem.call(this, key)
        }
        Storage.prototype.clear = function clear() {
            recordStorage(this, "clear", "*")
            return originalLocalClear.call(this)
        }

        return () => {
            window.fetch = originalFetch
            if (originalSendBeacon) {
                navigator.sendBeacon = originalSendBeacon
            }
            Storage.prototype.setItem = originalLocalSetItem
            Storage.prototype.removeItem = originalLocalRemoveItem
            Storage.prototype.clear = originalLocalClear
        }
    }, [enabled, tool])

    if (!tool) return null

    const expectedHosts = tool.networkHosts.length > 0 ? tool.networkHosts.join(", ") : copy.noneDeclared
    const networkCountText = networkLog.length === 1
        ? `1 ${copy.requestObserved}`
        : `${networkLog.length} ${copy.requestsObserved}`
    const externalHostText = externalHosts.length > 0 ? externalHosts.join(", ") : copy.noExternalHosts

    if (!expanded) {
        return (
            <Button
                type="button"
                size="icon"
                variant={enabled ? "default" : "secondary"}
                className="fixed bottom-4 right-4 z-40 rounded-full border border-border/70 shadow-md"
                onClick={() => setExpanded(true)}
                aria-label={copy.ariaLabel}
                aria-expanded={false}
                data-verification-mode-launcher
            >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </Button>
        )
    }

    return (
        <aside
            className="fixed bottom-4 right-4 z-50 w-[min(calc(100vw-2rem),24rem)] rounded-lg border border-border/75 bg-background/95 p-3 shadow-xl backdrop-blur"
            aria-label={copy.ariaLabel}
            data-verification-mode-panel
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="inline-flex items-center gap-2 text-sm font-semibold">
                        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                        {copy.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {copy.description}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {copy.scope}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        size="sm"
                        variant={enabled ? "default" : "outline"}
                        onClick={() => setEnabled((current) => !current)}
                        aria-pressed={enabled}
                    >
                        {enabled ? copy.on : copy.off}
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setExpanded(false)}
                        aria-label={copy.close}
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <div className="mt-3 grid gap-2 text-xs">
                <div className="rounded-md border border-border/70 bg-card/45 p-2">
                    <p className="font-medium text-foreground">{tool.privacy.executionMode === "external-request" ? copy.externalRequestTool : copy.browserLocalTool}</p>
                    <p className="mt-1 text-muted-foreground">{copy.declaredHosts}: {expectedHosts}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-card/45 p-2">
                    <p className="inline-flex items-center gap-2 font-medium text-foreground">
                        <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                        {networkCountText}
                    </p>
                    <p className="mt-1 text-muted-foreground">{copy.externalHosts}: {externalHostText}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-card/45 p-2">
                    <p className="inline-flex items-center gap-2 font-medium text-foreground">
                        <Database className="h-3.5 w-3.5" aria-hidden="true" />
                        {copy.storageKeysObserved}
                    </p>
                    {storageLog.length > 0 ? (
                        <ul className="mt-1 max-h-24 space-y-1 overflow-y-auto text-muted-foreground">
                            {storageLog.slice(0, 5).map((entry) => (
                                <li key={entry.id}>
                                    {formatTime(entry.timestamp)} {entry.area}.{entry.operation}({entry.key}) {entry.allowed ? copy.storageAllowed : copy.storageReview}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-1 text-muted-foreground">{copy.noStorageChanges}</p>
                    )}
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href={`/${lang}/trust-center#verify-local-processing`}
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {copy.trustCenterLink}
                </Link>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        setNetworkLog([])
                        setStorageLog([])
                    }}
                    disabled={networkLog.length === 0 && storageLog.length === 0}
                >
                    <Trash2 className="h-4 w-4" />
                    {copy.clearLog}
                </Button>
            </div>
            <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {enabled ? `${copy.enabledStatus} ${networkCountText}.` : copy.disabledStatus}
            </span>
        </aside>
    )
}
