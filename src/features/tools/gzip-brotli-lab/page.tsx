"use client"

import * as React from "react"
import { Copy, FileArchive, Play } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    formatByteSize,
    hasCompressionStreamSupport,
    validateBase64Input,
    type CompressionFormatName,
    type CompressionMode,
    type CompressionResult,
} from "@/features/tools/gzip-brotli-lab/utils"
import { runCompressionTask } from "@/features/tools/gzip-brotli-lab/compression-task"
import { WideToolPageContainer } from "@/components/layout/page-container"

export function GzipBrotliLabPage() {
    const { t } = useLang()
    const toolT = t.tools["gzip_brotli_lab"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [mode, setMode] = React.useState<CompressionMode>("compress")
    const [format, setFormat] = React.useState<CompressionFormatName>("gzip")
    const [result, setResult] = React.useState<CompressionResult | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [isRunning, setIsRunning] = React.useState(false)
    const abortControllerRef = React.useRef<AbortController | null>(null)

    const formatSupported = hasCompressionStreamSupport(format)
    const inputEncoding = mode === "compress" ? "text" : "base64"
    const outputEncoding = mode === "compress" ? "base64" : "text"

    const run = React.useCallback(async () => {
        if (!input.trim()) {
            toast.error(t.common.input_required)
            return
        }
        if (mode === "decompress" && !validateBase64Input(input)) {
            setError(text("invalid_base64"))
            return
        }

        setIsRunning(true)
        setError(null)
        abortControllerRef.current?.abort()
        const controller = new AbortController()
        abortControllerRef.current = controller
        try {
            const nextResult = await runCompressionTask({
                input,
                mode,
                format,
                inputEncoding,
                outputEncoding,
            }, { signal: controller.signal })
            setOutput(nextResult.output)
            setResult(nextResult)
            toast.success(text(mode === "compress" ? "compressed" : "decompressed"))
        } catch (runError) {
            if (runError instanceof Error && runError.message === "WORKER_ABORTED") {
                setError(text("operation_cancelled"))
                return
            }
            setOutput("")
            setResult(null)
            setError(runError instanceof Error ? runError.message : text("operation_failed"))
        } finally {
            setIsRunning(false)
        }
    }, [format, input, inputEncoding, mode, outputEncoding, t.common.input_required, text])

    const copyOutput = React.useCallback(async () => {
        if (!output) return
        const copyResult = await safeClipboardWrite(output)
        if (!copyResult.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }, [output, t.common.copy_failed, t.common.copied])

    const loadExample = React.useCallback(() => {
        setMode("compress")
        setFormat("gzip")
        setInput(JSON.stringify({ event: "cache_miss", path: "/api/users", durationMs: 184 }, null, 2))
        setOutput("")
        setResult(null)
        setError(null)
    }, [])

    const cancelRun = React.useCallback(() => {
        abortControllerRef.current?.abort()
        setIsRunning(false)
        setError(text("operation_cancelled"))
    }, [text])

    return (
        <WideToolPageContainer className="flex flex-col gap-6 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <FileArchive className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">{text("description")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={loadExample}>{t.common.try_example}</Button>
                    <Button size="sm" onClick={() => void run()} disabled={isRunning || !formatSupported}>
                        <Play className="mr-2 h-4 w-4" />
                        {isRunning ? text("running") : text("run_action")}
                    </Button>
                    {isRunning ? (
                        <Button variant="outline" size="sm" onClick={cancelRun}>
                            {t.common.cancel}
                        </Button>
                    ) : null}
                    <Button variant="outline" size="sm" onClick={() => void copyOutput()} disabled={!output}>
                        <Copy className="mr-2 h-4 w-4" />
                        {t.common.copy}
                    </Button>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                    <Label>{text("mode_label")}</Label>
                    <Select value={mode} onValueChange={(value) => setMode(value as CompressionMode)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="compress">{text("mode_compress")}</SelectItem>
                            <SelectItem value="decompress">{text("mode_decompress")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>{text("format_label")}</Label>
                    <Select value={format} onValueChange={(value) => setFormat(value as CompressionFormatName)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gzip">Gzip</SelectItem>
                            <SelectItem value="deflate">Deflate</SelectItem>
                            <SelectItem value="brotli">Brotli</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">{text("browser_support")}</div>
                    <div className={formatSupported ? "font-semibold text-green-700 dark:text-green-300" : "font-semibold text-destructive"}>
                        {formatSupported ? text("supported") : text("unsupported")}
                    </div>
                </div>
            </div>

            <Alert>
                <AlertDescription>{text("support_note")}</AlertDescription>
            </Alert>
            {!formatSupported && (
                <Alert variant="destructive">
                    <AlertDescription>{text("unsupported_hint")}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                    <Label>{text("input_label")} ({inputEncoding})</Label>
                    <Textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder={mode === "compress" ? text("compress_placeholder") : text("decompress_placeholder")}
                        className="min-h-[420px] font-mono text-sm"
                    />
                </div>
                <div className="space-y-2">
                    <Label>{text("output_label")} ({outputEncoding})</Label>
                    <Textarea
                        value={output}
                        readOnly
                        placeholder={text("output_placeholder")}
                        className="min-h-[420px] bg-muted font-mono text-sm"
                    />
                </div>
            </div>

            {result && (
                <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">{text("input_size")}</div>
                        <div className="text-lg font-semibold">{formatByteSize(result.inputBytes)}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">{text("output_size")}</div>
                        <div className="text-lg font-semibold">{formatByteSize(result.outputBytes)}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">{text("ratio")}</div>
                        <div className="text-lg font-semibold">{result.ratio.toFixed(2)}x</div>
                    </div>
                    <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">{text("format_label")}</div>
                        <div className="text-lg font-semibold uppercase">{format}</div>
                    </div>
                </div>
            )}
        </WideToolPageContainer>
    )
}
