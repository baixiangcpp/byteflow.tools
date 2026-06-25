"use client"

import * as React from "react"
import { Copy, Eraser, FileKey2, KeyRound, Play, RotateCcw, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { ModeSelector } from "@/features/tool-shell/mode-selector"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { convertPublicKey, formatSummary } from "./logic"
import { SAMPLE_PUBLIC_JWK, SAMPLE_PUBLIC_KEY_PEM } from "./samples"
import type { PublicKeyConversionResult, PublicKeyInputFormat, PublicKeyOutputFormat } from "./types"

const INPUT_FORMAT_OPTIONS = [
    { value: "pem", label: "PEM" },
    { value: "jwk", label: "JWK" },
] as const

const OUTPUT_FORMAT_OPTIONS = [
    { value: "jwk", label: "JWK" },
    { value: "pem", label: "PEM" },
] as const

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="grid gap-1 border-b border-border/40 py-2 last:border-0 sm:grid-cols-[11rem_1fr]">
            <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
            <dd className={mono ? "break-all font-mono text-sm text-foreground" : "break-words text-sm text-foreground"}>{value}</dd>
        </div>
    )
}

export function PublicKeyJwkHelperPage() {
    const { t } = useLang()
    const toolT = t.tools["public_key_jwk_helper"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key] || key, [toolT])
    const [inputFormat, setInputFormat] = React.useState<PublicKeyInputFormat>("pem")
    const [outputFormat, setOutputFormat] = React.useState<PublicKeyOutputFormat>("jwk")
    const [input, setInput] = React.useState(SAMPLE_PUBLIC_KEY_PEM)
    const [result, setResult] = React.useState<PublicKeyConversionResult | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [isRunning, setIsRunning] = React.useState(false)

    const run = React.useCallback(() => {
        setIsRunning(true)
        void convertPublicKey(input, { inputFormat, outputFormat })
            .then((nextResult) => {
                setResult(nextResult)
                setError(null)
            })
            .catch((conversionError: unknown) => {
                setResult(null)
                setError(conversionError instanceof Error ? conversionError.message : String(conversionError))
            })
            .finally(() => {
                setIsRunning(false)
            })
    }, [input, inputFormat, outputFormat])

    const loadSample = () => {
        setInput(inputFormat === "pem" ? SAMPLE_PUBLIC_KEY_PEM : SAMPLE_PUBLIC_JWK)
        setResult(null)
        setError(null)
    }

    const clear = () => {
        setInput("")
        setResult(null)
        setError(null)
    }

    const swapFormats = () => {
        setInputFormat(outputFormat)
        setOutputFormat(inputFormat)
        setInput(result?.output.trim() || (outputFormat === "pem" ? SAMPLE_PUBLIC_KEY_PEM : SAMPLE_PUBLIC_JWK))
        setResult(null)
        setError(null)
    }

    const copyOutput = async () => {
        if (!result?.output) return
        const clipboardResult = await safeClipboardWrite(result.output)
        if (!clipboardResult.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, { description: t.common.copied_desc })
    }

    const copySummary = async () => {
        if (!result?.summary) return
        const clipboardResult = await safeClipboardWrite(formatSummary(result.summary))
        if (!clipboardResult.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, { description: text("summary_copied_desc") })
    }

    const actions: ToolAction[] = [
        {
            id: "convert",
            label: isRunning ? text("converting") : text("convert_action"),
            icon: Play,
            variant: "default",
            onClick: run,
            disabled: isRunning,
        },
        {
            id: "copy_output",
            label: t.common.copy,
            icon: Copy,
            onClick: () => void copyOutput(),
            disabled: !result?.output,
        },
        {
            id: "sample",
            label: t.common.sample,
            icon: RotateCcw,
            onClick: loadSample,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: clear,
        },
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

            <SensitiveInputWarning />

            <div className="grid gap-3 rounded-lg border border-border/70 bg-card/40 p-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
                <ModeSelector
                    label={text("input_format")}
                    value={inputFormat}
                    options={INPUT_FORMAT_OPTIONS}
                    onChange={(value) => {
                        setInputFormat(value)
                        setInput(value === "pem" ? SAMPLE_PUBLIC_KEY_PEM : SAMPLE_PUBLIC_JWK)
                        setResult(null)
                        setError(null)
                    }}
                    size="sm"
                />
                <button
                    type="button"
                    onClick={swapFormats}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                    <ShieldCheck className="h-4 w-4" />
                    {text("swap_formats")}
                </button>
                <ModeSelector
                    label={text("output_format")}
                    value={outputFormat}
                    options={OUTPUT_FORMAT_OPTIONS}
                    onChange={(value) => {
                        setOutputFormat(value)
                        setResult(null)
                        setError(null)
                    }}
                    size="sm"
                />
            </div>

            {error ? (
                <div className="rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">{error}</div>
            ) : null}

            <div className="grid flex-1 gap-4 lg:grid-cols-2">
                <div className="flex min-h-[440px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header flex items-center gap-2">
                        <FileKey2 className="h-4 w-4" />
                        {text("source_key")}
                    </div>
                    <Textarea
                        className="h-full min-h-[380px] resize-none border-0 p-4 font-mono text-xs leading-5"
                        value={input}
                        onChange={(event) => {
                            setInput(event.target.value)
                            setResult(null)
                            setError(null)
                        }}
                        placeholder={inputFormat === "pem" ? "-----BEGIN PUBLIC KEY-----" : "{ \"kty\": \"EC\", ... }"}
                        spellCheck={false}
                    />
                </div>

                <div className="flex min-h-[440px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{text("converted_key")}</div>
                    <Textarea
                        className="h-full min-h-[380px] resize-none border-0 p-4 font-mono text-xs leading-5"
                        value={result?.output || ""}
                        readOnly
                        spellCheck={false}
                    />
                </div>
            </div>

            {result ? (
                <section className="rounded-lg border bg-card p-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold uppercase text-muted-foreground">{text("summary_title")}</h2>
                        <button
                            type="button"
                            onClick={() => void copySummary()}
                            className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                        >
                            <Copy className="h-3.5 w-3.5" />
                            {text("copy_summary")}
                        </button>
                    </div>
                    <dl>
                        <SummaryRow label={text("key_type")} value={result.summary.keyType} />
                        <SummaryRow label={text("algorithm")} value={result.summary.algorithm} />
                        {result.summary.curve ? <SummaryRow label={text("curve")} value={result.summary.curve} /> : null}
                        {result.summary.modulusBits ? <SummaryRow label={text("modulus_bits")} value={String(result.summary.modulusBits)} /> : null}
                        {result.summary.keyUse ? <SummaryRow label={text("key_use")} value={result.summary.keyUse} /> : null}
                        {result.summary.keyOps.length > 0 ? <SummaryRow label={text("key_ops")} value={result.summary.keyOps.join(", ")} /> : null}
                        {result.summary.kid ? <SummaryRow label={text("key_id")} value={result.summary.kid} mono /> : null}
                        <SummaryRow label={text("thumbprint")} value={result.summary.thumbprint} mono />
                    </dl>
                </section>
            ) : null}

            <RelatedTools toolKey="public_key_jwk_helper" />
        </div>
    )
}
