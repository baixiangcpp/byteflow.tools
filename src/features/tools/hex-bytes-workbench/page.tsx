"use client"

import * as React from "react"
import { Copy, FileText, Play } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { inspectBytes, type ByteInputMode, type ByteWorkbenchResult } from "@/features/tools/hex-bytes-workbench/utils"
import { WideToolPageContainer } from "@/components/layout/page-container"

const MODES: ByteInputMode[] = ["text", "hex", "base64"]

export function HexBytesWorkbenchPage() {
    const { t } = useLang()
    const toolT = t.tools["hex_bytes_workbench"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [input, setInput] = React.useState("")
    const [mode, setMode] = React.useState<ByteInputMode>("text")
    const [result, setResult] = React.useState<ByteWorkbenchResult | null>(null)

    const run = React.useCallback(() => {
        if (!input.trim()) {
            toast.error(t.common.input_required)
            return
        }
        const next = inspectBytes(input, mode)
        setResult(next)
        if (next.ok) toast.success(text("decoded"))
        else toast.error(text("decode_failed"))
    }, [input, mode, t.common.input_required, text])

    const copyHex = React.useCallback(async () => {
        if (!result?.hex) return
        const copied = await safeClipboardWrite(result.hex)
        if (!copied.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }, [result, t.common.copy_failed, t.common.copied])

    const loadExample = React.useCallback(() => {
        setMode("text")
        setInput("Byteflow 🔒\nAPI=local")
        setResult(null)
    }, [])

    return (
        <WideToolPageContainer className="flex flex-col gap-6 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{text("title")}</h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{text("description")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={loadExample}><FileText className="mr-2 h-4 w-4" />{t.common.try_example}</Button>
                    <Button size="sm" onClick={run}><Play className="mr-2 h-4 w-4" />{text("inspect_action")}</Button>
                    <Button variant="outline" size="sm" onClick={() => void copyHex()} disabled={!result?.hex}><Copy className="mr-2 h-4 w-4" />{text("copy_hex")}</Button>
                </div>
            </div>

            {result?.error ? <Alert variant="destructive"><AlertDescription>{result.error}</AlertDescription></Alert> : null}
            {result?.truncated ? <Alert><AlertDescription>{text("truncated_warning")}</AlertDescription></Alert> : null}

            <div className="flex flex-wrap gap-2" role="group" aria-label={text("input_mode")}>
                {MODES.map((item) => (
                    <Button key={item} type="button" variant={mode === item ? "default" : "outline"} size="sm" onClick={() => setMode(item)}>
                        {text(`mode_${item}`)}
                    </Button>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="space-y-2">
                    <Label htmlFor="hex-bytes-input">{text("input_label")}</Label>
                    <Textarea
                        id="hex-bytes-input"
                        value={input}
                        onChange={(event) => {
                            setInput(event.target.value)
                            setResult(null)
                        }}
                        placeholder={text("input_placeholder")}
                        className="min-h-[360px] font-mono text-sm"
                        spellCheck={false}
                    />
                </section>
                <section className="space-y-2">
                    <Label htmlFor="hex-bytes-output">{text("hex_output")}</Label>
                    <Textarea
                        id="hex-bytes-output"
                        value={result?.hex || ""}
                        readOnly
                        placeholder={text("hex_placeholder")}
                        className="min-h-[360px] bg-muted font-mono text-sm"
                        spellCheck={false}
                    />
                </section>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("bytes")}</div><div className="text-2xl font-bold">{result?.stats.byteLength ?? 0}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("printable_ascii")}</div><div className="text-2xl font-bold">{result?.stats.printableAscii ?? 0}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("null_bytes")}</div><div className="text-2xl font-bold">{result?.stats.nullBytes ?? 0}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("high_bytes")}</div><div className="text-2xl font-bold">{result?.stats.highBytes ?? 0}</div></div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="space-y-2">
                    <Label>{text("utf8_text")}</Label>
                    <Textarea value={result?.text || ""} readOnly className="min-h-[160px] bg-muted font-mono text-sm" />
                </section>
                <section className="space-y-2">
                    <Label>{text("base64_output")}</Label>
                    <Textarea value={result?.base64 || ""} readOnly className="min-h-[160px] bg-muted font-mono text-sm" />
                </section>
            </div>

            {result?.rows.length ? (
                <div className="overflow-hidden rounded-lg border">
                    <div className="border-b bg-muted px-4 py-2 text-sm font-semibold">{text("byte_table")}</div>
                    <div className="max-h-[360px] overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-background">
                                <tr className="border-b">
                                    <th className="px-4 py-2 text-left">{text("offset")}</th>
                                    <th className="px-4 py-2 text-left">Hex</th>
                                    <th className="px-4 py-2 text-left">Dec</th>
                                    <th className="px-4 py-2 text-left">Binary</th>
                                    <th className="px-4 py-2 text-left">ASCII</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.rows.map((row) => (
                                    <tr key={row.offset} className="border-b last:border-b-0">
                                        <td className="px-4 py-2 font-mono text-xs">{row.offset.toString(16).padStart(4, "0")}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{row.hex}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{row.decimal}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{row.binary}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{row.ascii}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </WideToolPageContainer>
    )
}
