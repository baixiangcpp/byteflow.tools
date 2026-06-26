import { readStorageString, removeStorageKey, writeStorageString } from "@/core/storage/tool-persistence"

export type AnalyticsPreference = "default" | "opted_out"

const ANALYTICS_OPT_OUT_KEY = "byteflow:analytics:opt-out"

export function getAnalyticsPreference(): AnalyticsPreference {
    return readStorageString(ANALYTICS_OPT_OUT_KEY) === "1" ? "opted_out" : "default"
}

export function setAnalyticsOptOut(optedOut: boolean): void {
    if (optedOut) {
        writeStorageString(ANALYTICS_OPT_OUT_KEY, "1")
    } else {
        removeStorageKey(ANALYTICS_OPT_OUT_KEY)
    }
}

export function isAnalyticsOptedOut(): boolean {
    return getAnalyticsPreference() === "opted_out"
}
