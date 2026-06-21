"use client"

import * as React from "react"
import { Copy, Eraser, ShieldCheck, ShieldAlert, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    base64UrlEncode,
    checkClaims,
    decodeHeader,
    decodePayload,
} from "./logic"

const ICON_BUTTON_CLASS =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-accent/50"

let toastPromise: Promise<typeof import("sonner")["toast"]> | null = null

async function loadToast() {
    toastPromise ??= import("sonner").then((module) => module.toast)
    return toastPromise
}

// ─── JWT Verification Engine (HMAC-SHA256 only, client-side) ────────────────

async function verifyHS256(token: string, secret: string): Promise<boolean> {
    const parts = token.split(".")
    if (parts.length !== 3) return false
    const signingInput = `${parts[0]}.${parts[1]}`
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    )
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput))
    const expected = base64UrlEncode(new Uint8Array(sig))
    return expected === parts[2]
}

async function verifyHS384(token: string, secret: string): Promise<boolean> {
    const parts = token.split(".")
    if (parts.length !== 3) return false
    const signingInput = `${parts[0]}.${parts[1]}`
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-384" }, false, ["sign"])
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput))
    return base64UrlEncode(new Uint8Array(sig)) === parts[2]
}

async function verifyHS512(token: string, secret: string): Promise<boolean> {
    const parts = token.split(".")
    if (parts.length !== 3) return false
    const signingInput = `${parts[0]}.${parts[1]}`
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"])
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput))
    return base64UrlEncode(new Uint8Array(sig)) === parts[2]
}

export function JwtVerifierPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["jwt_verifier"] as Record<string, string>
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
    const [verifyResult, setVerifyResult] = React.useState<"valid" | "invalid" | null>(null)
    const [algorithm, setAlgorithm] = React.useState("")
    const [header, setHeader] = React.useState<Record<string, unknown> | null>(null)
    const [payload, setPayload] = React.useState<Record<string, unknown> | null>(null)
    const [claims, setClaims] = React.useState<{ label: string; status: string; value: string }[]>([])

    const verify = async () => {
        if (!token.trim()) return

        const h = decodeHeader(token)
        const p = decodePayload(token)
        setHeader(h)
        setPayload(p)
        const alg = h?.alg as string || "unknown"
        setAlgorithm(alg)

        if (p) setClaims(checkClaims(p, claimLabels))

        if (!secret.trim()) {
            setVerifyResult(null)
            return
        }

        let valid = false
        if (alg === "HS256") valid = await verifyHS256(token, secret)
        else if (alg === "HS384") valid = await verifyHS384(token, secret)
        else if (alg === "HS512") valid = await verifyHS512(token, secret)

        setVerifyResult(valid ? "valid" : "invalid")
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
            onClick: () => { void verify() },
            variant: "default",
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

            <div className="space-y-2">
                <label className="text-sm font-medium">{toolT.token_label}</label>
                <Textarea className="min-h-[120px] font-mono text-xs leading-5" placeholder={toolT.token_placeholder} value={token} onChange={(e) => setToken(e.target.value)} spellCheck={false} />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">{toolT.secret_label}</label>
                <Input
                    type="password"
                    autoComplete="off"
                    className="font-mono text-sm"
                    placeholder={toolT.secret_placeholder}
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                />
            </div>

            {/* Verification Result */}
            {verifyResult && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${verifyResult === "valid" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                    {verifyResult === "valid" ? <CheckCircle className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                    <span className="font-medium">
                        {verifyResult === "valid"
                            ? toolT.result_valid.replace("{alg}", algorithm)
                            : toolT.result_invalid.replace("{alg}", algorithm)}
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
