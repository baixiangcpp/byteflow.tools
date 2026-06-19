"use client"

import * as React from "react"
import { Copy, Download, Eraser, Fingerprint, Hash, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ModeSelector } from "@/features/tool-shell/mode-selector"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    emptyHmacHashes,
    emptyStandardHashes,
    hashBytes,
    hashHmac,
    hashText,
    hashTextByAlgorithm,
    type HmacHashes,
    type StandardHashAlgorithm,
    type StandardHashes,
} from "@/core/utils/hash-utils"
import { downloadTextFile } from "./browser-actions"
import { BATCH_ALGORITHMS } from "./constants"
import type { HashMode } from "./types"

export function HashGeneratorPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["hash_generator"] as Record<string, string>

    const [mode, setMode] = React.useState<HashMode>("text")
    const [input, setInput] = React.useState("")
    const [secret, setSecret] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [fileSize, setFileSize] = React.useState(0)
    const [fileError, setFileError] = React.useState<string | null>(null)
    const [fileBytes, setFileBytes] = React.useState<Uint8Array | null>(null)
    const [batchAlgorithm, setBatchAlgorithm] = React.useState<StandardHashAlgorithm>("sha256")
    const sha1Warning = toolT.sha1_warning
    const buildCopyActionLabel = React.useCallback((label: string) => `${t.common.copy} ${label}`, [t.common.copy])
    const modeOptions = React.useMemo(() => [
        { value: "text" as const, label: toolT.mode_text },
        { value: "hmac" as const, label: toolT.mode_hmac },
        { value: "file" as const, label: toolT.mode_file },
        { value: "batch" as const, label: toolT.mode_batch },
    ], [toolT])

    const standardHashes = React.useMemo<StandardHashes>(() => {
        if (mode === "text") return hashText(input)
        if (mode === "file" && fileBytes) return hashBytes(fileBytes)
        return emptyStandardHashes()
    }, [mode, input, fileBytes])

    const hmacHashes = React.useMemo<HmacHashes>(() => {
        if (mode !== "hmac") return emptyHmacHashes()
        return hashHmac(input, secret)
    }, [mode, input, secret])

    const batchRows = React.useMemo(() => {
        if (mode !== "batch" || !input.trim()) return []
        return input
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line, index) => ({
                index: index + 1,
                line,
                hash: hashTextByAlgorithm(line, batchAlgorithm),
            }))
    }, [mode, input, batchAlgorithm])

    const handleCopy = async (text: string, label: string) => {
        if (!text) return
        const result = await safeClipboardWrite(text)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: label === "SHA-1" ? sha1Warning : undefined,
        })
    }

    const handleClear = () => {
        setInput("")
        setSecret("")
        setFileName("")
        setFileSize(0)
        setFileBytes(null)
        setFileError(null)
    }

    const handleFileSelect = async (file: File | null) => {
        if (!file) return
        try {
            const buffer = await file.arrayBuffer()
            setFileBytes(new Uint8Array(buffer))
            setFileName(file.name)
            setFileSize(file.size)
            setFileError(null)
        } catch {
            setFileBytes(null)
            setFileName("")
            setFileSize(0)
            setFileError(toolT.file_error)
        }
    }

    const downloadBatch = (format: "csv" | "txt") => {
        if (!batchRows.length) return

        const content = format === "csv"
            ? [
                "index,input,algorithm,hash",
                ...batchRows.map((row) => `${row.index},\"${row.line.replace(/\"/g, '\"\"')}\",${batchAlgorithm},${row.hash}`),
            ].join("\n")
            : batchRows.map((row) => `${row.index}. ${row.line} => ${row.hash}`).join("\n")

        downloadTextFile(content, format === "csv" ? "hash-batch.csv" : "hash-batch.txt")
    }

    const actions: ToolAction[] = [
        {
            id: "md5_quick",
            label: toolT.md5_quick_link,
            icon: Hash,
            href: `/${lang}/md5-generator`,
        },
        {
            id: "sha224_quick",
            label: toolT.sha224_quick_link,
            icon: Hash,
            href: `/${lang}/sha224-digest-generator`,
        },
        {
            id: "sha384_quick",
            label: toolT.sha384_quick_link,
            icon: Hash,
            href: `/${lang}/sha384-digest-generator`,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Fingerprint className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>

                <ToolActionBar actions={actions} />
            </div>

            <div className="rounded-lg border bg-card p-3">
                <ModeSelector label={toolT.mode_label} value={mode} options={modeOptions} onChange={setMode} size="sm" />
            </div>

            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                {sha1Warning}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                    {(mode === "text" || mode === "hmac") ? (
                        <>
                            <label className="text-sm font-medium">{toolT.input_text}</label>
                            <Textarea
                                className="min-h-[280px] resize-none font-mono text-sm leading-relaxed"
                                placeholder={toolT.text_placeholder}
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                spellCheck={false}
                            />
                        </>
                    ) : null}

                    {mode === "batch" ? (
                        <>
                            <label className="text-sm font-medium">{toolT.batch_input}</label>
                            <Textarea
                                className="min-h-[280px] resize-none font-mono text-sm leading-relaxed"
                                placeholder={toolT.batch_placeholder}
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                spellCheck={false}
                            />
                        </>
                    ) : null}

                    {mode === "hmac" ? (
                        <>
                            <label className="text-sm font-medium">{toolT.secret_key}</label>
                            <Input
                                className="font-mono text-sm"
                                value={secret}
                                onChange={(event) => setSecret(event.target.value)}
                                placeholder={toolT.secret_placeholder}
                            />
                        </>
                    ) : null}

                    {mode === "file" ? (
                        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                            <label className="text-sm font-medium">{toolT.file_input}</label>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                                <Upload className="h-4 w-4" />
                                <span>{toolT.select_file}</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] || null
                                        void handleFileSelect(file)
                                    }}
                                />
                            </label>
                            <p className="text-xs text-muted-foreground">{toolT.file_hint}</p>
                            {fileName ? <p className="text-xs font-medium text-foreground">{fileName} ({(fileSize / 1024).toFixed(1)} KB)</p> : null}
                            {fileError ? <p className="text-xs text-destructive">{fileError}</p> : null}
                        </div>
                    ) : null}
                </div>

                <div className="space-y-4">
                    {(mode === "text" || mode === "file") ? (
                        <>
                            <HashOutputBox
                                label="MD5"
                                value={standardHashes.md5}
                                onCopy={() => void handleCopy(standardHashes.md5, "MD5")}
                                copyActionLabel={buildCopyActionLabel("MD5")}
                            />
                            <HashOutputBox
                                label="SHA-1"
                                value={standardHashes.sha1}
                                onCopy={() => void handleCopy(standardHashes.sha1, "SHA-1")}
                                copyActionLabel={buildCopyActionLabel("SHA-1")}
                                hint={toolT.sha1_badge}
                                hintClassName="text-amber-700 dark:text-amber-300"
                            />
                            <HashOutputBox
                                label="SHA-224"
                                value={standardHashes.sha224}
                                onCopy={() => void handleCopy(standardHashes.sha224, "SHA-224")}
                                copyActionLabel={buildCopyActionLabel("SHA-224")}
                            />
                            <HashOutputBox
                                label="SHA-256"
                                value={standardHashes.sha256}
                                onCopy={() => void handleCopy(standardHashes.sha256, "SHA-256")}
                                copyActionLabel={buildCopyActionLabel("SHA-256")}
                            />
                            <HashOutputBox
                                label="SHA-384"
                                value={standardHashes.sha384}
                                onCopy={() => void handleCopy(standardHashes.sha384, "SHA-384")}
                                copyActionLabel={buildCopyActionLabel("SHA-384")}
                            />
                            <HashOutputBox
                                label="SHA-512"
                                value={standardHashes.sha512}
                                onCopy={() => void handleCopy(standardHashes.sha512, "SHA-512")}
                                copyActionLabel={buildCopyActionLabel("SHA-512")}
                            />
                        </>
                    ) : null}

                    {mode === "hmac" ? (
                        <>
                            <HashOutputBox
                                label={toolT.hmac_sha256}
                                value={hmacHashes.sha256}
                                onCopy={() => void handleCopy(hmacHashes.sha256, toolT.hmac_sha256)}
                                copyActionLabel={buildCopyActionLabel(toolT.hmac_sha256)}
                            />
                            <HashOutputBox
                                label={toolT.hmac_sha512}
                                value={hmacHashes.sha512}
                                onCopy={() => void handleCopy(hmacHashes.sha512, toolT.hmac_sha512)}
                                copyActionLabel={buildCopyActionLabel(toolT.hmac_sha512)}
                            />
                        </>
                    ) : null}

                    {mode === "batch" ? (
                        <div className="space-y-3 rounded-lg border bg-card p-4">
                            <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {toolT.batch_algorithm}
                                    </label>
                                    <Select value={batchAlgorithm} onValueChange={(value) => setBatchAlgorithm(value as StandardHashAlgorithm)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BATCH_ALGORITHMS.map((algorithm) => (
                                                <SelectItem key={algorithm.key} value={algorithm.key}>{algorithm.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {toolT.batch_export}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <Button variant="outline" size="sm" onClick={() => downloadBatch("csv")} disabled={!batchRows.length}>
                                            <Download className="mr-1 h-3.5 w-3.5" />
                                            {toolT.export_csv}
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => downloadBatch("txt")} disabled={!batchRows.length}>
                                            <Download className="mr-1 h-3.5 w-3.5" />
                                            {toolT.export_txt}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-md border">
                                <div className="grid grid-cols-[56px_1fr] border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <span>#</span>
                                    <span>{toolT.batch_hash}</span>
                                </div>
                                <div className="max-h-[340px] overflow-auto">
                                    {batchRows.length === 0 ? (
                                        <p className="px-3 py-4 text-sm text-muted-foreground">
                                            {toolT.batch_empty}
                                        </p>
                                    ) : (
                                        batchRows.map((row) => (
                                            <div key={`${row.index}-${row.line}`} className="grid grid-cols-[56px_1fr] gap-2 border-b px-3 py-2 text-xs last:border-b-0">
                                                <span className="text-muted-foreground">{row.index}</span>
                                                <div className="space-y-1">
                                                    <p className="truncate font-medium text-foreground">{row.line}</p>
                                                    <p className="break-all font-mono text-muted-foreground">{row.hash}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

function HashOutputBox({
    label,
    value,
    onCopy,
    copyActionLabel,
    hint,
    hintClassName,
}: {
    label: string
    value: string
    onCopy: () => void
    copyActionLabel: string
    hint?: string
    hintClassName?: string
}) {
    return (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground">{label}</label>
                    {hint ? (
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${hintClassName || ""}`}>
                            {hint}
                        </span>
                    ) : null}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onCopy}
                    disabled={!value}
                    aria-label={copyActionLabel}
                >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="sr-only">{copyActionLabel}</span>
                </Button>
            </div>
            <Input readOnly value={value} className="bg-muted/50 font-mono text-sm" placeholder={label} />
        </div>
    )
}
