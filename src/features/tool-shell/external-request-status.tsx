"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, CircleDashed, ExternalLink, ShieldAlert, WifiOff } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { cn } from "@/core/utils/utils"

export type ExternalRequestStatusKind =
    | "idle"
    | "invalid"
    | "ready"
    | "requesting"
    | "success"
    | "unreachable"
    | "blocked"
    | "offline"
    | "permission"

type ExternalRequestStatusProps = {
    status: ExternalRequestStatusKind
    message: string
    nextStep: string
    hosts: readonly string[]
    id?: string
    className?: string
}

const STATUS_STYLE: Record<ExternalRequestStatusKind, string> = {
    idle: "border-border bg-background text-muted-foreground",
    invalid: "border-destructive/35 bg-destructive/10 text-destructive",
    ready: "border-primary/30 bg-primary/10 text-primary",
    requesting: "border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    success: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    unreachable: "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    blocked: "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    offline: "border-destructive/35 bg-destructive/10 text-destructive",
    permission: "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",
}

const STATUS_ICON: Record<ExternalRequestStatusKind, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
    idle: CircleDashed,
    invalid: AlertTriangle,
    ready: ExternalLink,
    requesting: CircleDashed,
    success: CheckCircle2,
    unreachable: AlertTriangle,
    blocked: ShieldAlert,
    offline: WifiOff,
    permission: ShieldAlert,
}

const ASSERTIVE_STATUSES = new Set<ExternalRequestStatusKind>(["invalid", "unreachable", "blocked", "offline", "permission"])

export function ExternalRequestStatus({
    status,
    message,
    nextStep,
    hosts,
    id,
    className,
}: ExternalRequestStatusProps) {
    const { t } = useLang()
    const Icon = STATUS_ICON[status]
    const labels = t.common.external_request_status
    const role = ASSERTIVE_STATUSES.has(status) ? "alert" : "status"

    return (
        <section
            id={id}
            role={role}
            aria-live={role === "alert" ? "assertive" : "polite"}
            aria-atomic="true"
            data-external-request-status={status}
            className={cn("rounded-lg border p-3 text-sm", STATUS_STYLE[status], className)}
        >
            <div className="flex items-start gap-2">
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", status === "requesting" && "animate-pulse")} aria-hidden />
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="font-semibold text-foreground">
                        {labels[status]}
                    </div>
                    <p>{message}</p>
                    <p className="text-xs">
                        <span className="font-medium text-foreground">{labels.next_step_label}:</span>{" "}
                        {nextStep}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{labels.boundary_label}:</span>{" "}
                        {t.common.external_network_notice.consent_required_message}{" "}
                        <span className="font-mono">{hosts.join(", ")}</span>
                    </p>
                </div>
            </div>
        </section>
    )
}
