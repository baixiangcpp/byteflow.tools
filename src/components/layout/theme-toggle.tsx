"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { cn } from "@/core/utils/utils"
import { type ThemePreference, useThemePreference } from "@/hooks/use-theme-preference"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const THEME_OPTIONS: Array<{ value: ThemePreference; labelKey: "theme_light" | "theme_dark" | "theme_system" }> = [
    { value: "light", labelKey: "theme_light" },
    { value: "dark", labelKey: "theme_dark" },
    { value: "system", labelKey: "theme_system" },
]

export function ThemeToggle({ onReady }: { onReady?: () => void }) {
    const { theme, setTheme } = useThemePreference()
    const { t } = useLang()

    React.useLayoutEffect(() => {
        onReady?.()
    }, [onReady])

    const handleSetTheme = (theme: ThemePreference) => {
        setTheme(theme)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">{t.common.theme_toggle}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {THEME_OPTIONS.map((option) => {
                    const isSelected = theme === option.value
                    return (
                        <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={isSelected}
                            onCheckedChange={() => handleSetTheme(option.value)}
                            className={cn(isSelected && "bg-accent text-accent-foreground")}
                        >
                            {t.common[option.labelKey]}
                        </DropdownMenuCheckboxItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
