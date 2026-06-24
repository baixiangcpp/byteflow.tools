"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/core/utils/utils"

export type ToolEmptyStateProps = {
    icon?: LucideIcon
    title: string
    description?: string
    compact?: boolean
    className?: string
    titleAs?: "h2" | "h3" | "h4" | "p"
}

export function ToolEmptyState({
    icon: Icon,
    title,
    description,
    compact = false,
    className,
    titleAs = "p",
}: ToolEmptyStateProps) {
    const Title = titleAs

    if (compact) {
        return (
            <div className={cn("flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground", className)}>
                {Icon && <Icon className="h-4 w-4 shrink-0 opacity-60" />}
                <span className="font-medium">{title}</span>
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/10 p-8 text-center", className)}>
            {Icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                </div>
            )}
            <div className="max-w-[240px] space-y-1">
                <Title className="text-sm font-semibold text-foreground">{title}</Title>
                {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
            </div>
        </div>
    )
}
