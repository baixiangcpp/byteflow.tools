"use client"

import * as React from "react"
import { Copy, Eraser, ShieldCheck, ShieldAlert, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { ToolActionBar, type ToolAction, type ToolActionResult } from "@/features/tool-shell/tool-action-bar"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { JwtSecretField } from "@/features/tools/jwt-workbench/jwt-secret-field"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    checkClaims,
    decodeHeader,
    decodePayload,
    verifyJwtSignature,
    normalizeJwtAlgorithm,
    type JwtSignatureVerificationResult,
} from "./logic"

const ICON_BUTTON_CLASS =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-accent/50"

let toastPromise: Promise<typeof import("sonner")["toast"]> | null = null

async function loadToast() {
    toastPromise ??= import("sonner").then((module) => module.toast)
    return toastPromise
}

// ─── JWT Verification Engine (HMAC-SHA256 only, client-side) ────────────────

export function JwtVerifierPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["jwt_verifier"] as Record<string, string>
    const revealSecretLabel = t.common.reveal_secret
    const hideSecretLabel = t.common.hide_secret
    const claimLabels = React.useMemo(
        () => ({
            exp: toolT.claim_exp,
            nbf: toolT.claim_nbf,
            iat: toolT.claim_iat,
            iss: toolT.claim_iss,
            sub: toolT.claim_sub,
            aud: toolT.claim_aud,
        }),
        [toolT],
    )
    const notifyError = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.error(message)
    }, [])
    const notifySuccess = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.success(message)
    }, [])
    const [token, setToken] = React.useState("")
    const [secret, setSecret] = React.useState("")
    const [secretVisible, setSecretVisible] = React.useState(false)
    const [verifyResult, setVerifyResult] = React.useState<JwtSignatureVerificationResult | null>(null)
    const [header, setHeader] = React.useState<Record<string, unknown> | null>(null)
    const [payload, setPayload] = React.useState<Record<string, unknown> | null>(null)
    const [claims, setClaims] = React.useState<{ label: string; status: string; value: string }[]>([])

    const verify = async (): Promise<ToolActionResult> => {
        if (!token.trim()) return { status: "failed", message: t.common.input_required, description: toolT.token_label }

        const h = decodeHeader(token)
        const p = decodePayload(token)
        setHeader(h)
        setPayload(p)
        const alg = normalizeJwtAlgorithm(h?.alg)
        const algorithmClass = alg.toLowerCase() === "none"
            ? "unsigned"
            : alg === "HS256" || alg === "HS384" || alg === "HS512"
                ? "hmac"
                : "unsupported"

        if (p) setClaims(checkClaims(p, claimLabels))

        if (algorithmClass === "hmac" && !secret.trim()) {
            setVerifyResult(null)
            return {
                status: "failed",
                message: t.common.input_required,
                description: toolT.secret_label,
            }
        }

        const nextVerifyResult = await verifyJwtSignature(token, secret, alg)
        setVerifyResult(nextVerifyResult)
        if (!nextVerifyResult) {
            return {
                status: "failed",
                message: t.common.input_required,
                description: toolT.secret_label,
            }
        }
        if (nextVerifyResult.status === "valid") {
            return { status: "success", message: toolT.result_valid.replace("{alg}", nextVerifyResult.algorithm) }
        }
        if (nextVerifyResult.status === "invalid") {
            return { status: "failed", message: toolT.result_invalid.replace("{alg}", nextVerifyResult.algorithm) }
        }
        if (nextVerifyResult.status === "unsigned") {
            return { status: "success", message: toolT.result_none_warning }
        }
        return { status: "success", message: toolT.result_unsupported.replace("{alg}", nextVerifyResult.algorithm) }
    }
    const clearAll = () => {
        setToken("")
        setSecret("")
        setVerifyResult(null)
        setHeader(null)
        setPayload(null)
        setClaims([])
    }

    const copyJson = async (value: unknown) => {
        const result = await safeClipboardWrite(JSON.stringify(value, null, 2))
        if (!result.ok) {
            await notifyError(t.common.copy_failed)
            return
        }
        await notifySuccess(t.common.copied)
    }
    const actions: ToolAction[] = [
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: clearAll,
        },
        {
            id: "verify",
            label: toolT.verify_action,
            icon: ShieldCheck,
            onClick: verify,
            variant: "default",
            disabled: !token.trim(),
            disabledReason: toolT.token_label,
        },
    ]

    return (
        <div className="flex flex-col h-full space-y-6 max-w-5xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                <Link href={`/${lang}/jwt-workbench`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {toolT.workbench_cta}
                </Link>
            </div>

            <SensitiveInputWarning variant="token" />

            <div className="space-y-2">
                <label className="text-sm font-medium">{toolT.token_label}</label>
                <Textarea
                    aria-label={toolT.token_label}
                    className="min-h-[120px] font-mono text-xs leading-5"
                    placeholder={toolT.token_placeholder}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    spellCheck={false}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">{toolT.secret_label}</label>
                <JwtSecretField
                    ariaLabel={toolT.secret_label}
                    hideSecretLabel={hideSecretLabel}
                    onChange={setSecret}
                    onVisibilityChange={setSecretVisible}
                    placeholder={toolT.secret_placeholder}
                    revealSecretLabel={revealSecretLabel}
                    secretVisible={secretVisible}
                    value={secret}
                />
            </div>

            {/* Verification Result */}
            {verifyResult && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${verifyResult.status === "valid" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : verifyResult.status === "invalid" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                    {verifyResult.status === "valid" ? <CheckCircle className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                    <span className="font-medium">
                        {verifyResult.status === "valid"
                            ? toolT.result_valid.replace("{alg}", verifyResult.algorithm)
                            : verifyResult.status === "invalid"
                                ? toolT.result_invalid.replace("{alg}", verifyResult.algorithm)
                                : verifyResult.status === "unsigned"
                                    ? toolT.result_none_warning
                                    : toolT.result_unsupported.replace("{alg}", verifyResult.algorithm)}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Header */}
                {header && (
                    <div className="p-5 border rounded-lg bg-card shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.header_section}</h3>
                            <button
                                type="button"
                                className={ICON_BUTTON_CLASS}
                                onClick={() => void copyJson(header)}
                                aria-label={t.common.copy_output}
                            >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">{t.common.copy_output}</span>
                            </button>
                        </div>
                        <pre className="font-mono text-sm bg-muted/50 rounded p-3 overflow-auto whitespace-pre-wrap">{JSON.stringify(header, null, 2)}</pre>
                    </div>
                )}

                {/* Payload */}
                {payload && (
                    <div className="p-5 border rounded-lg bg-card shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.payload_section}</h3>
                            <button
                                type="button"
                                className={ICON_BUTTON_CLASS}
                                onClick={() => void copyJson(payload)}
                                aria-label={t.common.copy_output}
                            >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">{t.common.copy_output}</span>
                            </button>
                        </div>
                        <pre className="font-mono text-sm bg-muted/50 rounded p-3 overflow-auto whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre>
                    </div>
                )}
            </div>

            {/* Claims Check */}
            {claims.length > 0 && (
                <div className="p-5 border rounded-lg bg-card shadow-sm space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.claims_section}</h3>
                    <div className="space-y-2">
                        {claims.map((c, i) => (
                            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0">
                                {c.status === "valid" ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : c.status === "invalid" ? <XCircle className="h-4 w-4 text-red-500" /> : <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />}
                                <span className="text-sm font-medium w-40">{c.label}</span>
                                <span className="text-sm text-muted-foreground font-mono">{c.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <RelatedTools toolKey="jwt_verifier" />
        </div>
    )
}
