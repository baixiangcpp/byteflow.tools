export function isBrowserOffline(): boolean {
    return typeof navigator !== "undefined" && navigator.onLine === false
}
