"use client"

import * as React from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { requireTranslationValue } from "@/core/i18n/i18n"
import {
    readFavoriteToolKeys,
    toggleFavoriteToolKey,
    TOOL_DISCOVERY_UPDATED_EVENT,
} from "@/core/storage/tool-discovery-state"
import { cn } from "@/core/utils/utils"

type ToolFavoriteControlProps = {
    toolKey: string
}

export function ToolFavoriteControl({ toolKey }: ToolFavoriteControlProps) {
    const { t } = useLang()
    const [favoriteToolKeys, setFavoriteToolKeys] = React.useState<string[]>([])
    const isFavorite = favoriteToolKeys.includes(toolKey)
    const addLabel = requireTranslationValue(t.common.add_favorite, "common.add_favorite")
    const removeLabel = requireTranslationValue(t.common.remove_favorite, "common.remove_favorite")
    const privacyLabel = requireTranslationValue(t.common.favorites_local_only, "common.favorites_local_only")

    React.useEffect(() => {
        const sync = () => setFavoriteToolKeys(readFavoriteToolKeys())
        sync()
        window.addEventListener(TOOL_DISCOVERY_UPDATED_EVENT, sync)
        return () => window.removeEventListener(TOOL_DISCOVERY_UPDATED_EVENT, sync)
    }, [])

    return (
        <div
            className="mb-5 flex flex-wrap items-center justify-end gap-2 border-b border-border/70 pb-4"
            role="group"
            aria-label={`${addLabel} / ${removeLabel}`}
            data-tool-global-actions
        >
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 border-border bg-background shadow-xs"
                aria-label={isFavorite ? removeLabel : addLabel}
                aria-pressed={isFavorite}
                title={isFavorite ? removeLabel : addLabel}
                onClick={() => setFavoriteToolKeys(toggleFavoriteToolKey(toolKey))}
            >
                <Heart className={cn("h-4 w-4", isFavorite ? "fill-primary text-primary" : "")} />
                <span className="grid" aria-hidden="true">
                    <span className={cn("col-start-1 row-start-1", isFavorite && "invisible")}>{addLabel}</span>
                    <span className={cn("col-start-1 row-start-1", !isFavorite && "invisible")}>{removeLabel}</span>
                </span>
            </Button>
            <span className="text-xs text-muted-foreground">{privacyLabel}</span>
        </div>
    )
}
