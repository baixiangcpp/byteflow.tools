"use client"

import * as React from "react"

export function isBrowserOffline(): boolean {
    return typeof navigator !== "undefined" && navigator.onLine === false
}

export function useBrowserOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = React.useState(() => !isBrowserOffline())

    React.useEffect(() => {
        const update = () => setIsOnline(!isBrowserOffline())
        update()
        window.addEventListener("online", update)
        window.addEventListener("offline", update)
        return () => {
            window.removeEventListener("online", update)
            window.removeEventListener("offline", update)
        }
    }, [])

    return isOnline
}
