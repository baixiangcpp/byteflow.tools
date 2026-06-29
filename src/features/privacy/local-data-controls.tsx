"use client"

import * as React from "react"
import Link from "next/link"
import { BarChart3, Database, Heart, History, RefreshCw, ShieldCheck, Trash2, WifiOff, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { isAnalyticsEnabled, isAnalyticsOptedOut, setAnalyticsOptOut } from "@/core/analytics/analytics"
import { getAnalyticsOptOutStorageKey } from "@/core/analytics/preferences"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"
import { clearByteflowPwaCaches } from "@/core/storage/pwa-cache-controls"
import {
    clearFavoriteToolKeys,
    clearRecentToolKeys,
    getFavoriteToolStorageKey,
    getRecentToolStorageKey,
    readFavoriteToolKeys,
    readRecentToolKeys,
} from "@/core/storage/tool-discovery-state"
import { clearByteflowBrowserData } from "@/core/storage/tool-persistence-policy"
import { clearSavedRecipes, countSavedRecipes, isRecipeStoreAvailable } from "@/features/pipeline/recipe-store"

type LocalDataSummary = {
    favorites: number
    recentTools: number
    preferences: number
    savedRecipes: number | null
    recipeStoreAvailable: boolean
}

type PendingAction = "all" | "favorites" | "recent" | "preferences" | "recipes" | "cache" | null

const RESERVED_LOCAL_DATA_KEYS = new Set([
    getFavoriteToolStorageKey(),
    getRecentToolStorageKey(),
    getAnalyticsOptOutStorageKey(),
])

function formatCount(template: string, count: number): string {
    return template.replace("{count}", String(count))
}

function listPreferenceStorageKeys(): string[] {
    if (typeof window === "undefined") return []

    const keys: string[] = []
    try {
        for (let index = 0; index < window.localStorage.length; index += 1) {
            const key = window.localStorage.key(index)
            if (key?.startsWith("byteflow:") && !RESERVED_LOCAL_DATA_KEYS.has(key)) keys.push(key)
        }
    } catch {
        return keys
    }
    return keys
}

async function readLocalDataSummary(): Promise<LocalDataSummary> {
    const recipeStoreAvailable = isRecipeStoreAvailable()
    let savedRecipes: number | null = null
    if (recipeStoreAvailable) {
        const result = await countSavedRecipes()
        savedRecipes = result.ok ? result.value : null
    }

    return {
        favorites: readFavoriteToolKeys().length,
        recentTools: readRecentToolKeys().length,
        preferences: listPreferenceStorageKeys().length,
        savedRecipes,
        recipeStoreAvailable,
    }
}

export function LocalDataControls() {
    const { t, lang } = useLang()
    const [message, setMessage] = React.useState<string | null>(null)
    const [analyticsOptedOut, setAnalyticsOptedOut] = React.useState(false)
    const [summary, setSummary] = React.useState<LocalDataSummary>({
        favorites: 0,
        recentTools: 0,
        preferences: 0,
        savedRecipes: null,
        recipeStoreAvailable: false,
    })
    const [pendingAction, setPendingAction] = React.useState<PendingAction>(null)
    const labels = t.common.local_data_controls

    const refreshSummary = React.useCallback(async () => {
        setSummary(await readLocalDataSummary())
    }, [])

    React.useEffect(() => {
        setAnalyticsOptedOut(isAnalyticsOptedOut())
        void refreshSummary()
    }, [refreshSummary])

    const clearData = async () => {
        setPendingAction("all")
        const removed = clearByteflowBrowserData({
            preserveAnalyticsOptOut: true,
            includeSessionStorage: true,
        })
        let recipeCount = 0
        if (isRecipeStoreAvailable()) {
            const countResult = await countSavedRecipes()
            recipeCount = countResult.ok ? countResult.value : 0
            await clearSavedRecipes()
        }
        setAnalyticsOptedOut(isAnalyticsOptedOut())
        await refreshSummary()

        const totalRemoved = removed + recipeCount
        setPendingAction(null)
        if (totalRemoved === 0) {
            setMessage(requireTranslationValue(labels.none_found_message, "common.local_data_controls.none_found_message"))
            return
        }

        const messageTemplate = totalRemoved === 1
            ? requireTranslationValue(labels.cleared_one_message, "common.local_data_controls.cleared_one_message")
            : requireTranslationValue(labels.cleared_many_message, "common.local_data_controls.cleared_many_message")

        setMessage(formatCount(messageTemplate, totalRemoved))
    }

    const clearFavorites = async () => {
        setPendingAction("favorites")
        const count = readFavoriteToolKeys().length
        clearFavoriteToolKeys()
        await refreshSummary()
        setPendingAction(null)
        setMessage(formatCount(requireTranslationValue(labels.favorites_cleared_message, "common.local_data_controls.favorites_cleared_message"), count))
    }

    const clearRecent = async () => {
        setPendingAction("recent")
        const count = readRecentToolKeys().length
        clearRecentToolKeys()
        await refreshSummary()
        setPendingAction(null)
        setMessage(formatCount(requireTranslationValue(labels.recent_cleared_message, "common.local_data_controls.recent_cleared_message"), count))
    }

    const clearPreferences = async () => {
        setPendingAction("preferences")
        const keys = listPreferenceStorageKeys()
        keys.forEach((key) => window.localStorage.removeItem(key))
        await refreshSummary()
        setPendingAction(null)
        setMessage(formatCount(requireTranslationValue(labels.preferences_cleared_message, "common.local_data_controls.preferences_cleared_message"), keys.length))
    }

    const clearRecipes = async () => {
        setPendingAction("recipes")
        const countResult = await countSavedRecipes()
        const count = countResult.ok ? countResult.value : 0
        const clearResult = await clearSavedRecipes()
        await refreshSummary()
        setPendingAction(null)
        setMessage(clearResult.ok
            ? formatCount(requireTranslationValue(labels.recipes_cleared_message, "common.local_data_controls.recipes_cleared_message"), count)
            : requireTranslationValue(labels.recipes_unavailable_message, "common.local_data_controls.recipes_unavailable_message"))
    }

    const clearCache = async () => {
        setPendingAction("cache")
        try {
            const count = await clearByteflowPwaCaches()
            setMessage(count === 0
                ? requireTranslationValue(labels.cache_none_message, "common.local_data_controls.cache_none_message")
                : requireTranslationValue(labels.cache_cleared_message, "common.local_data_controls.cache_cleared_message"))
        } catch {
            setMessage(requireTranslationValue(labels.cache_unavailable_message, "common.local_data_controls.cache_unavailable_message"))
        } finally {
            setPendingAction(null)
        }
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
        <div id="local-data-controls" className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/55 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 id="local-data-controls-title" className="flex items-center gap-2 text-lg font-semibold">
                            <Database className="h-4 w-4 text-primary" aria-hidden="true" />
                            {requireTranslationValue(labels.title, "common.local_data_controls.title")}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {requireTranslationValue(labels.description, "common.local_data_controls.description")}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {requireTranslationValue(labels.no_payloads_notice, "common.local_data_controls.no_payloads_notice")}
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => void clearData()} disabled={pendingAction !== null}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {requireTranslationValue(labels.clear_button, "common.local_data_controls.clear_button")}
                    </Button>
                </div>
                {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
            </div>
            <section className="grid gap-3 md:grid-cols-2" aria-labelledby="local-data-controls-title">
                {[
                    {
                        key: "favorites" as const,
                        icon: Heart,
                        title: requireTranslationValue(labels.favorites_title, "common.local_data_controls.favorites_title"),
                        count: summary.favorites,
                        description: requireTranslationValue(labels.favorites_description, "common.local_data_controls.favorites_description"),
                        button: requireTranslationValue(labels.clear_favorites_button, "common.local_data_controls.clear_favorites_button"),
                        onClick: clearFavorites,
                        disabled: summary.favorites === 0,
                    },
                    {
                        key: "recent" as const,
                        icon: History,
                        title: requireTranslationValue(labels.recent_title, "common.local_data_controls.recent_title"),
                        count: summary.recentTools,
                        description: requireTranslationValue(labels.recent_description, "common.local_data_controls.recent_description"),
                        button: requireTranslationValue(labels.clear_recent_button, "common.local_data_controls.clear_recent_button"),
                        onClick: clearRecent,
                        disabled: summary.recentTools === 0,
                    },
                    {
                        key: "preferences" as const,
                        icon: Database,
                        title: requireTranslationValue(labels.preferences_title, "common.local_data_controls.preferences_title"),
                        count: summary.preferences,
                        description: requireTranslationValue(labels.preferences_description, "common.local_data_controls.preferences_description"),
                        button: requireTranslationValue(labels.clear_preferences_button, "common.local_data_controls.clear_preferences_button"),
                        onClick: clearPreferences,
                        disabled: summary.preferences === 0,
                    },
                    {
                        key: "recipes" as const,
                        icon: Workflow,
                        title: requireTranslationValue(labels.recipes_title, "common.local_data_controls.recipes_title"),
                        count: summary.savedRecipes,
                        description: summary.recipeStoreAvailable
                            ? requireTranslationValue(labels.recipes_description, "common.local_data_controls.recipes_description")
                            : requireTranslationValue(labels.recipes_unavailable_message, "common.local_data_controls.recipes_unavailable_message"),
                        button: requireTranslationValue(labels.clear_recipes_button, "common.local_data_controls.clear_recipes_button"),
                        onClick: clearRecipes,
                        disabled: !summary.recipeStoreAvailable || (summary.savedRecipes ?? 0) === 0,
                    },
                    {
                        key: "cache" as const,
                        icon: WifiOff,
                        title: requireTranslationValue(labels.cache_title, "common.local_data_controls.cache_title"),
                        count: null,
                        description: requireTranslationValue(labels.cache_description, "common.local_data_controls.cache_description"),
                        button: requireTranslationValue(labels.clear_cache_button, "common.local_data_controls.clear_cache_button"),
                        onClick: clearCache,
                        disabled: false,
                    },
                ].map((item) => {
                    const Icon = item.icon
                    const isPending = pendingAction === item.key
                    return (
                        <article key={item.key} className="rounded-xl border border-border/70 bg-card/45 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                                        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                                </div>
                                {typeof item.count === "number" ? (
                                    <span className="rounded-md border border-border/70 bg-background/70 px-2 py-1 text-xs font-medium">
                                        {formatCount(requireTranslationValue(labels.count_label, "common.local_data_controls.count_label"), item.count)}
                                    </span>
                                ) : null}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => void item.onClick()}
                                disabled={pendingAction !== null || item.disabled}
                            >
                                {isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                {item.button}
                            </Button>
                        </article>
                    )
                })}
            </section>
            <section className="rounded-2xl border border-border/70 bg-background/55 p-5">
                <h2 className="text-lg font-semibold">{requireTranslationValue(labels.browser_settings_title, "common.local_data_controls.browser_settings_title")}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {requireTranslationValue(labels.browser_settings_description, "common.local_data_controls.browser_settings_description")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/${lang}/install-app`}>
                        {requireTranslationValue(labels.install_app_link, "common.local_data_controls.install_app_link")}
                    </Link>
                    <Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/${lang}/trust-center#verify-local-processing`}>
                        {requireTranslationValue(labels.verification_link, "common.local_data_controls.verification_link")}
                    </Link>
                </div>
            </section>
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
