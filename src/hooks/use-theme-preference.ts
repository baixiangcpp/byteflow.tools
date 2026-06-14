"use client"

import * as React from "react"
import { PWA_THEME_COLOR, PWA_THEME_COLOR_LIGHT } from "@/core/pwa/constants"

export type ThemePreference = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

const THEME_STORAGE_KEY = "theme"
const THEME_COOKIE_MAX_AGE = 31536000
function isThemePreference(value: string | null | undefined): value is ThemePreference {
    return value === "light" || value === "dark" || value === "system"
}

function readThemeCookie(): string | null {
    if (typeof document === "undefined") return null
    const match = document.cookie.match(/(?:^|;\s*)theme=([^;]*)/)
    return match ? decodeURIComponent(match[1]) : null
}

function readThemePreference(): ThemePreference {
    if (typeof window === "undefined") return "dark"

    try {
        const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
        if (isThemePreference(storedTheme)) {
            return storedTheme
        }
    } catch {
        // Ignore storage access failures and fall back to the cookie.
    }

    const cookieTheme = readThemeCookie()
    return isThemePreference(cookieTheme) ? cookieTheme : "dark"
}

function getSystemIsDark(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return true
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function resolveTheme(theme: ThemePreference, systemIsDark: boolean): ResolvedTheme {
    if (theme === "system") {
        return systemIsDark ? "dark" : "light"
    }

    return theme
}

function applyResolvedTheme(resolvedTheme: ResolvedTheme) {
    if (typeof document === "undefined") return

    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)
    root.style.colorScheme = resolvedTheme

    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) {
        themeMeta.setAttribute("content", resolvedTheme === "light" ? PWA_THEME_COLOR_LIGHT : PWA_THEME_COLOR)
    }
}

function persistThemePreference(theme: ThemePreference) {
    if (typeof document === "undefined") return

    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
        // Ignore storage write failures.
    }

    document.cookie = `theme=${encodeURIComponent(theme)};path=/;max-age=${THEME_COOKIE_MAX_AGE};SameSite=Lax`
}

export function useThemePreference() {
    const [theme, setTheme] = React.useState<ThemePreference>(() => readThemePreference())
    const [systemIsDark, setSystemIsDark] = React.useState(() => getSystemIsDark())

    React.useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return
        }

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleMediaChange = (event: MediaQueryListEvent) => {
            setSystemIsDark(event.matches)
        }

        setSystemIsDark(mediaQuery.matches)
        mediaQuery.addEventListener("change", handleMediaChange)
        return () => mediaQuery.removeEventListener("change", handleMediaChange)
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const handleStorage = (event: StorageEvent) => {
            if (event.key !== null && event.key !== THEME_STORAGE_KEY) {
                return
            }

            setTheme(readThemePreference())
        }

        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
    }, [])

    const resolvedTheme = resolveTheme(theme, systemIsDark)

    React.useEffect(() => {
        applyResolvedTheme(resolvedTheme)
        persistThemePreference(theme)
    }, [resolvedTheme, theme])

    const setThemePreference = React.useCallback((nextTheme: ThemePreference) => {
        setTheme(nextTheme)
    }, [])

    return {
        theme,
        resolvedTheme,
        setTheme: setThemePreference,
    }
}
