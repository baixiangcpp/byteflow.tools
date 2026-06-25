"use client"

import * as React from "react"
import { Copy, Eraser, KeyRound, Play, RotateCcw, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { generatePkcePair, summarizeJwks, verifyJwtWithJwks } from "./logic"
import { SAMPLE_INPUT, SAMPLE_JWT } from "./samples"

type Mode = "pkce" | "jwks"

export function OauthJwksWorkbenchPage() {
    const { t } = useLang()
    const toolT = t.tools["oauth_jwks_workbench"] as Record<string, string>
    const [mode, setMode] = React.useState<Mode>("pkce")
    const [jwks, setJwks] = React.useState(SAMPLE_INPUT)
    const [token, setToken] = React.useState(SAMPLE_JWT)
    const [selectedKey, setSelectedKey] = React.useState("sample-rsa-key")
    const [output, setOutput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const keyOptions = React.useMemo(() => {
        try {
            return summarizeJwks(jwks)
        } catch {
            return []
        }
    }, [jwks])

    React.useEffect(() => {
        if (mode !== "jwks") return
        if (keyOptions.length === 0) {
            if (selectedKey) setSelectedKey("")
            return
        }
        if (!keyOptions.some((key) => key.selector === selectedKey)) {
            setSelectedKey(keyOptions[0].selector)
        }
    }, [keyOptions, mode, selectedKey])

    const run = React.useCallback(() => {
        setError(null)
        if (mode === "pkce") {
            void generatePkcePair().then((pair) => setOutput(JSON.stringify(pair, null, 2))).catch((runError: unknown) => setError(runError instanceof Error ? runError.message : String(runError)))
            return
        }
        try {
            const keys = summarizeJwks(jwks)
            setOutput(JSON.stringify({ keys }, null, 2))
            void verifyJwtWithJwks(token, jwks, { selectedKey })
                .then((report) => setOutput(JSON.stringify({ keys, verification: report }, null, 2)))
                .catch((verifyError: unknown) => {
                    setOutput(JSON.stringify({ keys, verification: { valid: false, message: verifyError instanceof Error ? verifyError.message : String(verifyError) } }, null, 2))
                })
        } catch (runError) {
            setOutput("")
            setError(runError instanceof Error ? runError.message : String(runError))
        }
    }, [jwks, mode, selectedKey, token])

    const copyOutput = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const actions: ToolAction[] = [
        { id: "run", label: mode === "pkce" ? toolT.generate_pkce_action : toolT.inspect_jwks_action, icon: Play, onClick: run, variant: "default" },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void copyOutput(), disabled: !output },
        { id: "sample", label: t.common.sample, icon: RotateCcw, onClick: () => { setJwks(SAMPLE_INPUT); setToken(SAMPLE_JWT); setSelectedKey("sample-rsa-key"); setOutput(""); setError(null) } },
        { id: "clear", label: t.common.clear, icon: Eraser, onClick: () => { setJwks(""); setToken(""); setSelectedKey(""); setOutput(""); setError(null) } },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <KeyRound className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{toolT.description}</p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <SensitiveInputWarning variant="secret" />

            <div className="flex flex-wrap gap-2" role="group" aria-label={toolT.mode_label}>
                {(["pkce", "jwks"] as const).map((item) => (
                    <button
                        key={item}
                        type="button"
                        className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"}`}
                        onClick={() => {
                            setMode(item)
                            setOutput("")
                            setError(null)
                        }}
                    >
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        {item === "pkce" ? toolT.mode_pkce : toolT.mode_jwks}
                    </button>
                ))}
            </div>

            {mode === "jwks" ? (
                <div className="grid gap-2 rounded-lg border border-border/70 bg-card/55 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] sm:items-end">
                    <div>
                        <div className="text-sm font-medium">{toolT.selected_key_label}</div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {toolT.selected_key_help}
                        </p>
                    </div>
                    <select
                        className="min-h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={selectedKey}
                        onChange={(event) => setSelectedKey(event.target.value)}
                        aria-label={toolT.selected_key_label}
                        disabled={keyOptions.length === 0}
                    >
                        {keyOptions.length === 0 ? (
                            <option value="">{toolT.no_jwks_keys_option}</option>
                        ) : keyOptions.map((key) => (
                            <option key={key.selector} value={key.selector}>
                                {key.kid} - {key.kty}{key.alg ? ` / ${key.alg}` : ""}
                            </option>
                        ))}
                    </select>
                </div>
            ) : null}

            {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}

            <div className="grid flex-1 gap-4 lg:grid-cols-2">
                <div className="grid gap-4">
                    <section className="flex min-h-[260px] flex-col overflow-hidden rounded-lg border bg-card">
                        <div className="tool-pane-header">{toolT.jwks_label}</div>
                        <Textarea className="h-full min-h-[210px] resize-none border-0 p-4 font-mono text-xs leading-5" value={jwks} onChange={(event) => setJwks(event.target.value)} spellCheck={false} />
                    </section>
                    <section className="flex min-h-[220px] flex-col overflow-hidden rounded-lg border bg-card">
                        <div className="tool-pane-header">{toolT.jwt_label}</div>
                        <Textarea className="h-full min-h-[170px] resize-none border-0 p-4 font-mono text-xs leading-5" value={token} onChange={(event) => setToken(event.target.value)} spellCheck={false} />
                    </section>
                </div>
                <section className="flex min-h-[500px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{t.common.output}</div>
                    <Textarea className="h-full min-h-[440px] resize-none border-0 bg-muted/30 p-4 font-mono text-xs leading-5" value={output} readOnly spellCheck={false} />
                </section>
            </div>

            <RelatedTools toolKey="oauth_jwks_workbench" />
        </div>
    )
}
