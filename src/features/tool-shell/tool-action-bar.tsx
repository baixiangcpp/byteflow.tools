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
    disabledReason?: string
    destructive?: boolean
    href?: string
}

type AnalyticsAction = "tool_run" | "copy_output" | "download_output" | null

const ACTION_BASE_CLASS =
    "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 sm:min-h-9"

const ACTION_SIZE_CLASS: Record<ActionSize, string> = {
    sm: "px-3 py-2 sm:h-9 sm:py-0",
    icon: "w-11 sm:h-9 sm:w-9",
}

const ACTION_VARIANT_CLASS: Record<ActionVariant, string> = {
    default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
    outline: "border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
    ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
}

const ACTION_ORDER_PREFIXES = [
    "sample",
    "import",
    "upload",
    "clear",
    "reset",
    "preview",
    "format",
    "minify",
    "run",
    "validate",
    "convert",
    "generate",
    "decode",
    "encode",
    "hash",
    "copy",
    "download",
    "export",
    "share",
]

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

function getActionOrder(action: ToolAction): number {
    const normalized = action.id.trim().toLowerCase()
    const index = ACTION_ORDER_PREFIXES.findIndex((prefix) => normalized === prefix || normalized.startsWith(`${prefix}_`))
    return index === -1 ? ACTION_ORDER_PREFIXES.length : index
}

function getActionLabel(action: ToolAction, fallbackDisabledReason: string): string {
    const disabledReason = action.disabled ? action.disabledReason || fallbackDisabledReason : ""
    return disabledReason
        ? `${action.label}: ${disabledReason}`
        : action.label
}

function getActionDescriptionId(actionId: string): string {
    return `tool-action-${actionId.replace(/[^a-zA-Z0-9_-]/g, "-")}-disabled-reason`
}

function isDestructiveAction(action: ToolAction): boolean {
    const normalized = action.id.trim().toLowerCase()
    return action.destructive === true || normalized === "clear" || normalized === "reset" || normalized.startsWith("clear_") || normalized.startsWith("reset_")
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
    const { t, lang } = useLang()
    const toolKey = React.useMemo(() => {
        const context = getRouteContext(pathname)
        if (!context.slug) return null
        return getRouteToolBySlug(context.slug)?.key || null
    }, [pathname])

    const { handoffActions, primaryActions } = React.useMemo(() => {
        const handoffs: ToolAction[] = []
        const primary: Array<ToolAction & { orderIndex: number }> = []

        actions.forEach((action, orderIndex) => {
            const isHandoff =
                action.href?.startsWith("/") &&
                (action.id.startsWith("to_") || action.id.includes("handoff"))
            if (isHandoff) {
                handoffs.push(action)
            } else {
                primary.push({ ...action, orderIndex })
            }
        })

        primary.sort((left, right) => getActionOrder(left) - getActionOrder(right) || left.orderIndex - right.orderIndex)
        return { handoffActions: handoffs, primaryActions: primary }
    }, [actions])

    const triggerAction = React.useCallback(
        (action: ToolAction) => {
            if (action.disabled) return
            const analyticsAction = classifyAnalyticsAction(action.id)
            if (toolKey && analyticsAction) {
                if (analyticsAction === "tool_run") {
                    trackToolRun(toolKey, action.id, { language: lang, sourcePage: "tool_action_bar" })
                } else if (analyticsAction === "copy_output") {
                    trackCopyOutput(toolKey, action.id, lang)
                } else if (analyticsAction === "download_output") {
                    trackDownloadOutput(toolKey, action.id, { language: lang, sourcePage: "tool_action_bar" })
                }
            }
            action.onClick?.()
        },
        [lang, toolKey],
    )

    return (
        <div className={joinClasses("flex w-full flex-wrap items-center gap-2 sm:w-auto", className)}>
            {primaryActions.map((action) => {
                const Icon = action.icon
                const analyticsAction = classifyAnalyticsAction(action.id)
                const disabledReason = action.disabled ? action.disabledReason || t.common.action_disabled_unavailable : undefined
                const accessibleLabel = getActionLabel(action, t.common.action_disabled_unavailable)
                const disabledDescriptionId = disabledReason ? getActionDescriptionId(action.id) : undefined
                const isDestructive = isDestructiveAction(action)
                const variantClass = isDestructive
                    ? "border border-destructive/35 bg-background text-destructive shadow-xs hover:bg-destructive/10 dark:bg-input/30"
                    : ACTION_VARIANT_CLASS[action.variant ?? "outline"]

                if (action.href) {
                    return (
                        <React.Fragment key={action.id}>
                            <Link
                                href={action.href}
                                className={joinClasses(
                                    ACTION_BASE_CLASS,
                                    ACTION_SIZE_CLASS[action.size ?? "sm"],
                                    variantClass,
                                    "max-w-full",
                                    action.disabled && "pointer-events-none opacity-50",
                                )}
                                aria-disabled={action.disabled || undefined}
                                aria-describedby={disabledDescriptionId}
                                tabIndex={action.disabled ? -1 : undefined}
                                title={accessibleLabel}
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
                            {disabledReason ? (
                                <span id={disabledDescriptionId} className="sr-only">: {disabledReason}</span>
                            ) : null}
                        </React.Fragment>
                    )
                }

                return (
                    <React.Fragment key={action.id}>
                        <button
                            type="button"
                            className={joinClasses(
                                ACTION_BASE_CLASS,
                                ACTION_SIZE_CLASS[action.size ?? "sm"],
                                variantClass,
                                "max-w-full",
                            )}
                            onClick={() => triggerAction(action)}
                            disabled={action.disabled}
                            aria-describedby={disabledDescriptionId}
                            title={accessibleLabel}
                            data-analytics-action={analyticsAction || undefined}
                            data-analytics-id={action.id}
                        >
                            {Icon ? <Icon className="h-4 w-4" /> : null}
                            {action.label}
                        </button>
                        {disabledReason ? (
                            <span id={disabledDescriptionId} className="sr-only">: {disabledReason}</span>
                        ) : null}
                    </React.Fragment>
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
                                "max-w-full",
                            )}
                            disabled={!handoffPayload?.trim()}
                            title={!handoffPayload?.trim() ? t.common.action_disabled_no_output : undefined}
                            aria-label={!handoffPayload?.trim() ? `${t.common.send_to || "Send to..."}: ${t.common.action_disabled_no_output}` : undefined}
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
