"use client"

import Link from "next/link"
import { AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { cn } from "@/core/utils/utils"

type SensitiveInputWarningProps = {
    className?: string
    variant?: "default" | "token" | "secret" | "certificate" | "log" | "request"
}

const VARIANT_NOTE = {
    default: "sensitive_warning_default_note",
    token: "sensitive_warning_token_note",
    secret: "sensitive_warning_secret_note",
    certificate: "sensitive_warning_certificate_note",
    log: "sensitive_warning_log_note",
    request: "sensitive_warning_request_note",
} as const satisfies Record<NonNullable<SensitiveInputWarningProps["variant"]>, keyof ReturnType<typeof useLang>["t"]["common"]>

export function SensitiveInputWarning({
    className,
    variant = "default",
}: SensitiveInputWarningProps) {
    const { lang, t } = useLang()

    return (
        <aside
            className={cn(
                "rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-950 shadow-xs dark:text-amber-100",
                className,
            )}
            aria-label={t.common.sensitive_warning_label}
        >
            <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
                <div className="min-w-0 space-y-2">
                    <div>
                        <p className="font-semibold text-foreground">{t.common.sensitive_warning_title}</p>
                        <p className="mt-1 leading-relaxed">
                            {t.common.sensitive_warning_base} {t.common[VARIANT_NOTE[variant]]}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                        <Link className="inline-flex items-center gap-1 underline-offset-4 hover:underline" href={`/${lang}/trust-center`}>
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            {t.common.tool_trust_header.trust_center_link}
                        </Link>
                        <Link className="inline-flex items-center gap-1 underline-offset-4 hover:underline" href={`/${lang}/trust-center#verify-local-processing`}>
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            {t.common.sensitive_warning_verify_devtools}
                        </Link>
                    </div>
                </div>
            </div>
        </aside>
    )
}
