"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Share2, type LucideIcon } from "lucide-react"
import { getRouteToolBySlug } from "@/generated/route-tool-lookup"
import { getRouteContext } from "@/core/routing/route-context"
import { useLang } from "@/core/i18n/lang-provider"
import {
    detectInteractionAnalyticsAction,
    trackToolRun,
    trackCopyOutput,
    trackDownloadOutput,
} from "@/core/analytics/analytics"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type ActionVariant = "default" | "outline" | "ghost"
type ActionSize = "sm" | "icon"

export type ToolAction = {
    id: string
    label: string
    onClick?: () => void
    icon?: LucideIcon
    variant?: ActionVariant
    size?: ActionSize
    disabled?: boolean
    href?: string
}

type AnalyticsAction = "tool_run" | "copy_output" | "download_output" | null

const ACTION_BASE_CLASS =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

const ACTION_SIZE_CLASS: Record<ActionSize, string> = {
    sm: "h-9 px-3",
    icon: "h-9 w-9",
}

const ACTION_VARIANT_CLASS: Record<ActionVariant, string> = {
    default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
    outline: "border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
    ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
}

function joinClasses(...values: Array<string | null | undefined | false>) {
    return values.filter(Boolean).join(" ")
}

function classifyAnalyticsAction(actionId: string): AnalyticsAction {
    const normalized = actionId.trim().toLowerCase()
    if (normalized.length === 0) return null

    const interactionAction = detectInteractionAnalyticsAction(actionId)
    if (interactionAction) return interactionAction
    if (["sample", "reset", "clear"].includes(normalized)) return null

    return "tool_run"
}

export function ToolActionBar({
    actions,
    className,
    handoffPayload,
}: {
    actions: ToolAction[]
    className?: string
    handoffPayload?: string
}) {
    const pathname = usePathname()
    const { t } = useLang()
    const toolKey = React.useMemo(() => {
        const context = getRouteContext(pathname)
        if (!context.slug) return null
        return getRouteToolBySlug(context.slug)?.key || null
    }, [pathname])

    const { handoffActions, primaryActions } = React.useMemo(() => {
        const handoffs: ToolAction[] = []
        const primary: ToolAction[] = []

        actions.forEach((action) => {
            const isHandoff =
                action.href?.startsWith("/") &&
                (action.id.startsWith("to_") || action.id.includes("handoff"))
            if (isHandoff) {
                handoffs.push(action)
            } else {
                primary.push(action)
            }
        })

        return { handoffActions: handoffs, primaryActions: primary }
    }, [actions])

    const triggerAction = React.useCallback(
        (action: ToolAction) => {
            if (action.disabled) return
            const analyticsAction = classifyAnalyticsAction(action.id)
            if (toolKey && analyticsAction) {
                if (analyticsAction === "tool_run") {
                    trackToolRun(toolKey, action.id)
                } else if (analyticsAction === "copy_output") {
                    trackCopyOutput(toolKey, action.id)
                } else if (analyticsAction === "download_output") {
                    trackDownloadOutput(toolKey, action.id)
                }
            }
            action.onClick?.()
        },
        [toolKey],
    )

    return (
        <div className={joinClasses("flex flex-wrap items-center gap-2", className)}>
            {primaryActions.map((action) => {
                const Icon = action.icon
                const analyticsAction = classifyAnalyticsAction(action.id)

                if (action.href) {
                    return (
                        <Link
                            key={action.id}
                            href={action.href}
                            className={joinClasses(
                                ACTION_BASE_CLASS,
                                ACTION_SIZE_CLASS[action.size ?? "sm"],
                                ACTION_VARIANT_CLASS[action.variant ?? "outline"],
                                action.disabled && "pointer-events-none opacity-50",
                            )}
                            aria-disabled={action.disabled || undefined}
                            tabIndex={action.disabled ? -1 : undefined}
                            data-analytics-action={analyticsAction || undefined}
                            data-analytics-id={action.id}
                            onClick={(event) => {
                                if (action.disabled) {
                                    event.preventDefault()
                                    return
                                }
                                triggerAction(action)
                            }}
                        >
                            {Icon ? <Icon className="h-4 w-4" /> : null}
                            {action.label}
                        </Link>
                    )
                }

                return (
                    <button
                        key={action.id}
                        type="button"
                        className={joinClasses(
                            ACTION_BASE_CLASS,
                            ACTION_SIZE_CLASS[action.size ?? "sm"],
                            ACTION_VARIANT_CLASS[action.variant ?? "outline"],
                        )}
                        onClick={() => triggerAction(action)}
                        disabled={action.disabled}
                        data-analytics-action={analyticsAction || undefined}
                        data-analytics-id={action.id}
                    >
                        {Icon ? <Icon className="h-4 w-4" /> : null}
                        {action.label}
                    </button>
                )
            })}

            {handoffActions.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className={joinClasses(
                                ACTION_BASE_CLASS,
                                ACTION_SIZE_CLASS["sm"],
                                ACTION_VARIANT_CLASS["outline"],
                            )}
                            disabled={!handoffPayload?.trim()}
                        >
                            <Share2 className="h-4 w-4" />
                            {t.common.send_to || "Send to..."}
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>{t.common.recommended_tools || "Recommended Tools"}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {handoffActions.map((action) => {
                            const analyticsAction = classifyAnalyticsAction(action.id)
                            return (
                                <DropdownMenuItem key={action.id} asChild disabled={action.disabled}>
                                    <Link
                                        href={action.href!}
                                        onClick={(e) => {
                                            if (action.disabled) {
                                                e.preventDefault()
                                                return
                                            }
                                            triggerAction(action)
                                        }}
                                        className={joinClasses(
                                            "flex w-full items-center gap-2 cursor-pointer",
                                            action.disabled && "opacity-50 pointer-events-none",
                                        )}
                                        aria-disabled={action.disabled || undefined}
                                        data-analytics-action={analyticsAction || undefined}
                                        data-analytics-id={action.id}
                                    >
                                        {action.icon && <action.icon className="h-4 w-4 opacity-70" />}
                                        <span>{action.label}</span>
                                    </Link>
                                </DropdownMenuItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    )
}
