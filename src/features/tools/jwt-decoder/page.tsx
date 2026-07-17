"use client"

import * as React from "react"
import { ShieldAlert, Eraser, TestTube2, Copy, KeyRound, Clock3 } from "lucide-react"
import Link from "next/link"
import { useLang } from "@/core/i18n/lang-provider"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { copyTextWithLazyToolFeedback } from "@/features/tool-shell/lazy-tool-action-feedback"
import { InlineToolActionFeedback, useInlineToolActionFeedback } from "@/features/tool-shell/inline-tool-action-feedback"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { decodeJwtParts, JwtDecodeError, type JwtClaimSemantic, type JwtDecodeErrorCode, type JwtSemanticSummary } from "./utils"
import { WideToolPageContainer } from "@/components/layout/page-container"

function formatLocalTime(utc: string): string {
    return new Date(utc).toLocaleString()
}

function getErrorKey(error: unknown): string {
    if (!(error instanceof JwtDecodeError)) return "error_decode_failed"
    const keys: Record<JwtDecodeErrorCode, string> = {
        segment_count: "error_segment_count",
        empty_segment: "error_empty_segment",
        invalid_base64url: "error_invalid_base64url",
        invalid_json: "error_invalid_json",
        decode_failed: "error_decode_failed",
    }
    return keys[error.code]
}

function getClaimStatusClass(status: JwtClaimSemantic["status"]): string {
    if (status === "valid") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    if (status === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    if (status === "invalid") return "border-destructive/30 bg-destructive/10 text-destructive"
    return "border-border/70 bg-muted/45 text-muted-foreground"
}

function getClaimCopyValue(claim: JwtClaimSemantic): string {
    if (typeof claim.epochSeconds === "number") return String(claim.epochSeconds)
    return claim.valueSummary ?? ""
}

export function JwtDecoderPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["jwt_decoder"] as Record<string, string>
    const [input, setInput] = React.useState("")
    const [header, setHeader] = React.useState("")
    const [payload, setPayload] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [semantics, setSemantics] = React.useState<JwtSemanticSummary | null>(null)
    const { feedback: copyFeedback, run: runCopyAction } = useInlineToolActionFeedback()

    const { resolvedTheme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)

    React.useEffect(() => {
        if (!input.trim()) {
            setHeader("")
            setPayload("")
            setError(null)
            return
        }

        try {
            const decoded = decodeJwtParts(input)

            setHeader(JSON.stringify(decoded.header, null, 2))
            setPayload(JSON.stringify(decoded.payload, null, 2))
            setSemantics(decoded.semantics)
            setError(null)
        } catch (decodeError) {
            setHeader("")
            setPayload("")
            setSemantics(null)
            setError(toolT[getErrorKey(decodeError)] || toolT.error_invalid_token)
        }
    }, [input, toolT])

    const handleClear = () => {
        setInput("")
        setHeader("")
        setPayload("")
        setSemantics(null)
        setError(null)
    }

    const handleUseSample = () => {
        // Sample JWT with standard claims (expired token, safe for demo)
        const sampleJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIENoZW4iLCJlbWFpbCI6ImFsaWNlQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        setInput(sampleJwt)
    }

    const handleCopyHeader = () => {
        if (!header) return
        return runCopyAction(() => copyTextWithLazyToolFeedback(
            t,
            header,
            toolT.header_label,
            toolT.header_copied || "Header copied",
        ))
    }

    const handleCopyPayload = () => {
        if (!payload) return
        return runCopyAction(() => copyTextWithLazyToolFeedback(
            t,
            payload,
            toolT.payload_label,
            toolT.payload_copied || "Payload copied",
        ))
    }

    const handleCopyClaim = (claim: JwtClaimSemantic) => {
        const value = getClaimCopyValue(claim)
        if (!value) return
        return runCopyAction(() => copyTextWithLazyToolFeedback(
            t,
            value,
            claim.claim,
            toolT.claim_copied.replace("{claim}", claim.claim),
        ))
    }

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: t.common.sample,
            icon: TestTube2,
            onClick: handleUseSample,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
            destructive: true,
        },
    ]

    return (
        <WideToolPageContainer className="flex flex-col h-full space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-primary" />
                        {toolT.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <InlineToolActionFeedback feedback={copyFeedback} />

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                        <div className="space-y-1">
                            <p className="font-semibold">{toolT.decode_only_title}</p>
                            <p>{toolT.decode_only_desc}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm md:min-w-64">
                    <Link href={`/${lang}/jwt-verifier`} className="inline-flex items-center gap-2 font-medium text-primary underline-offset-4 hover:underline">
                        <KeyRound className="h-4 w-4" />
                        {toolT.verifier_cta}
                    </Link>
                    <Link href={`/${lang}/jwt-workbench`} className="inline-flex items-center gap-2 font-medium text-primary underline-offset-4 hover:underline">
                        <ShieldAlert className="h-4 w-4" />
                        {toolT.workbench_cta}
                    </Link>
                </div>
            </div>

            <SensitiveInputWarning variant="token" />

            {error && (
                <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <p className="font-semibold">{toolT.error_title}</p>
                    <p className="mt-1">{toolT.error_invalid_token}</p>
                    {error !== toolT.error_invalid_token ? (
                        <p className="mt-1 text-xs">{error}</p>
                    ) : null}
                </div>
            )}

            {/* Workspace Grid */}
            <div data-input-intent="workbench" className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[600px]">
                {/* Input Pane */}
                <div className="flex flex-col h-full border rounded-lg bg-card overflow-hidden">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.encoded_token_label}</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            intent="payload"
                            className="h-full w-full resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 p-4 font-mono text-sm leading-relaxed"
                            placeholder={toolT.token_placeholder}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            aria-label={toolT.encoded_token_label}
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* Output Panes */}
                <div className="flex flex-col h-full gap-4">
                    <div className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{toolT.header_label}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`${t.common.copy}: ${toolT.header_label}`}
                                onClick={handleCopyHeader}
                                disabled={!header}
                            >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">{t.common.copy}</span>
                            </Button>
                        </div>
                        <div className="flex-1 min-h-[150px]">
                            <MonacoEditor
                                intent="generatedOutput"
                                height="100%"
                                language="json"
                                theme={monacoTheme}
                                beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                                value={header}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    fontFamily: "var(--font-mono)",
                                    lineHeight: 24,
                                    padding: { top: 16 },
                                    scrollBeyondLastLine: false,
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex-[2] flex flex-col border rounded-lg bg-card overflow-hidden">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{toolT.payload_label}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`${t.common.copy}: ${toolT.payload_label}`}
                                onClick={handleCopyPayload}
                                disabled={!payload}
                            >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">{t.common.copy}</span>
                            </Button>
                        </div>
                        <div className="flex-1 min-h-[300px]">
                            <MonacoEditor
                                intent="generatedOutput"
                                height="100%"
                                language="json"
                                theme={monacoTheme}
                                beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                                value={payload}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    fontFamily: "var(--font-mono)",
                                    lineHeight: 24,
                                    padding: { top: 16 },
                                    scrollBeyondLastLine: false,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {semantics ? (
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                <Clock3 className="h-4 w-4" />
                                {toolT.claims_summary_title}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">{toolT.claim_time_note}</p>
                        </div>
                        <div className="rounded-md border bg-muted/45 px-2.5 py-1 text-xs text-muted-foreground">
                            {toolT.algorithm_label}: <span className="font-mono text-foreground">{semantics.algorithm}</span>
                        </div>
                    </div>

                    {semantics.warnings.length > 0 ? (
                        <div className="mt-3 space-y-2">
                            {semantics.warnings.includes("alg_none") ? (
                                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {toolT.alg_none_warning}
                                </p>
                            ) : null}
                            {semantics.warnings.includes("expired") ? (
                                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                                    {toolT.expired_warning}
                                </p>
                            ) : null}
                            {semantics.warnings.includes("not_yet_valid") ? (
                                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                                    {toolT.not_yet_valid_warning}
                                </p>
                            ) : null}
                            {semantics.warnings.includes("issued_in_future") ? (
                                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                                    {toolT.issued_future_warning}
                                </p>
                            ) : null}
                        </div>
                    ) : null}

                    {semantics.claims.length > 0 ? (
                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                            {semantics.claims.map((claim) => (
                                <div key={claim.claim} className={`rounded-md border p-3 text-sm ${getClaimStatusClass(claim.status)}`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-mono font-semibold">{claim.claim}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="rounded border border-current/20 px-1.5 py-0.5 text-xs uppercase tracking-wide">
                                                {toolT[`claim_status_${claim.status}`]}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                aria-label={toolT.copy_claim_value.replace("{claim}", claim.claim)}
                                                title={toolT.copy_claim_value.replace("{claim}", claim.claim)}
                                                onClick={() => void handleCopyClaim(claim)}
                                                disabled={!getClaimCopyValue(claim)}
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="mt-1">{toolT[`claim_detail_${claim.detail}`]}</p>
                                    {claim.utc ? (
                                        <div className="mt-2 space-y-1 font-mono text-xs">
                                            <p>UTC: {claim.utc}</p>
                                            <p>{toolT.local_time_label}: {formatLocalTime(claim.utc)}</p>
                                        </div>
                                    ) : null}
                                    {claim.valueSummary ? (
                                        <p className="mt-2 text-xs">
                                            {toolT.claim_value_summary_label}: <span className="font-mono">{claim.valueSummary}</span>
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-4 rounded-md border bg-muted/45 px-3 py-2 text-sm text-muted-foreground">
                            {toolT.no_registered_claims}
                        </p>
                    )}
                </div>
            ) : null}
        </WideToolPageContainer>
    )
}
