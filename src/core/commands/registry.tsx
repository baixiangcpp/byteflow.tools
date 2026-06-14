"use client"

import { useThemePreference } from "@/hooks/use-theme-preference"
import { useRouter } from "next/navigation"
import { clearHistory } from "@/core/storage/tool-discovery-state"
import {
    Palette,
    Trash2,
    Copy,
    Home
} from "lucide-react"
import { SystemCommand } from "./types"
import { useCallback, useMemo } from "react"

export function useSystemCommands() {
    const { setTheme, resolvedTheme } = useThemePreference()
    const router = useRouter()

    const toggleTheme = useCallback(() => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }, [resolvedTheme, setTheme])

    const copyUrl = useCallback(() => {
        navigator.clipboard.writeText(window.location.href)
    }, [])

    const goToHome = useCallback(() => {
        router.push("/")
    }, [router])

    const commands: SystemCommand[] = useMemo(() => [
        {
            id: "toggle-theme",
            labelKey: "common.theme",
            icon: Palette,
            keywords: ["theme", "dark", "light", "toggle", "mode", "color"],
            execute: toggleTheme,
        },
        {
            id: "clear-history",
            labelKey: "common.clear",
            icon: Trash2,
            keywords: ["clear", "history", "recent", "favorites", "reset", "cache", "storage"],
            execute: clearHistory,
        },
        {
            id: "copy-url",
            labelKey: "common.copy",
            icon: Copy,
            keywords: ["copy", "url", "link", "share", "address", "clipboard"],
            execute: copyUrl,
        },
        {
            id: "go-to-home",
            labelKey: "nav.home",
            icon: Home,
            keywords: ["home", "index", "dashboard", "main", "start", "go to"],
            execute: goToHome,
        },
    ], [toggleTheme, copyUrl, goToHome])

    return commands
}
