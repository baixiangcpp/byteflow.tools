"use client"

const BYTEFLOW_CACHE_PREFIX = "byteflow-"
const SERVICE_WORKER_CACHE_CLEAR_TIMEOUT_MS = 1500

export async function deleteByteflowCacheBuckets(): Promise<number> {
    if (typeof window === "undefined" || !("caches" in window)) {
        throw new Error("CacheStorage unavailable")
    }

    const cacheKeys = await window.caches.keys()
    const byteflowCacheKeys = cacheKeys.filter((key) => key.startsWith(BYTEFLOW_CACHE_PREFIX))
    await Promise.all(byteflowCacheKeys.map((key) => window.caches.delete(key)))
    return byteflowCacheKeys.length
}

export async function requestServiceWorkerCacheClear(): Promise<void> {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return
    const controller = navigator.serviceWorker.controller
    if (!controller) return

    await new Promise<void>((resolve) => {
        const cleanup = () => {
            window.clearTimeout(timeoutId)
            navigator.serviceWorker.removeEventListener("message", handleMessage)
        }
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type !== "BYTEFLOW_CACHES_CLEARED") return
            cleanup()
            resolve()
        }
        const timeoutId = window.setTimeout(() => {
            cleanup()
            resolve()
        }, SERVICE_WORKER_CACHE_CLEAR_TIMEOUT_MS)

        navigator.serviceWorker.addEventListener("message", handleMessage)
        controller.postMessage({ type: "CLEAR_BYTEFLOW_CACHES" })
    })
}

export async function clearByteflowPwaCaches(): Promise<number> {
    const firstPassCount = await deleteByteflowCacheBuckets()
    await requestServiceWorkerCacheClear()
    const secondPassCount = await deleteByteflowCacheBuckets()
    return firstPassCount + secondPassCount
}
