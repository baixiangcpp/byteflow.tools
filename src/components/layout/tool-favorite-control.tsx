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
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10"
                aria-pressed={isFavorite}
                onClick={() => setFavoriteToolKeys(toggleFavoriteToolKey(toolKey))}
            >
                <Heart className={cn("h-4 w-4", isFavorite ? "fill-primary text-primary" : "")} />
                {isFavorite ? removeLabel : addLabel}
            </Button>
            <span className="text-xs text-muted-foreground">{privacyLabel}</span>
        </div>
    )
}

