"use client"

import * as React from "react"
import { Copy, Download, Eraser, Fingerprint, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolEmptyState } from "@/features/tool-shell/tool-empty-state"
import {
    hashBytes,
    hashHmac,
    hashTextByAlgorithm,
    type HmacHashes,
    type StandardHashAlgorithm,
} from "@/core/utils/hash-utils"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { FILE_INPUT_POLICIES, describeFilePolicy, readArrayBufferWithPolicy, validateFileAgainstPolicy } from "@/core/files/file-input-policy"

type HashMode = "text" | "file" | "hmac" | "batch"

type FocusedHashToolPageProps = {
    algorithm: StandardHashAlgorithm
    title: string
    description: string
    sampleText?: string
    weakAlgorithmWarning?: string
    enableFile?: boolean
    enableHmac?: boolean
    enableBatch?: boolean
    relatedToolKey?: string
}

function downloadTextFile(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}

function algorithmLabel(algorithm: StandardHashAlgorithm): string {
    if (algorithm === "md5") return "MD5"
    if (algorithm === "sha1") return "SHA-1"
    if (algorithm === "sha224") return "SHA-224"
    if (algorithm === "sha256") return "SHA-256"
    if (algorithm === "sha384") return "SHA-384"
    return "SHA-512"
}

function resolveHmacDigest(hmac: HmacHashes, algorithm: StandardHashAlgorithm): string {
    if (algorithm === "sha256") return hmac.sha256
    if (algorithm === "sha512") return hmac.sha512
    return ""
}

export function FocusedHashToolPage({
    algorithm,
    title,
    description,
    sampleText = "sample_001",
    weakAlgorithmWarning,
    enableFile = true,
    enableHmac = false,
    enableBatch = false,
    relatedToolKey = "hash_generator",
}: FocusedHashToolPageProps) {
    const { t, lang } = useLang()

    const [mode, setMode] = React.useState<HashMode>("text")
    const [input, setInput] = React.useState("")
    const [secret, setSecret] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [fileSize, setFileSize] = React.useState(0)
    const [fileBytes, setFileBytes] = React.useState<Uint8Array | null>(null)
    const [fileError, setFileError] = React.useState<string | null>(null)
    const filePolicy = FILE_INPUT_POLICIES["hash-file"]

    const visibleModes = React.useMemo<HashMode[]>(() => {
        const next: HashMode[] = ["text"]
        if (enableFile) next.push("file")
        if (enableHmac) next.push("hmac")
        if (enableBatch) next.push("batch")
        return next
    }, [enableBatch, enableFile, enableHmac])

    React.useEffect(() => {
        if (!visibleModes.includes(mode)) setMode("text")
    }, [mode, visibleModes])

    const textDigest = React.useMemo(() => {
        if (mode !== "text") return ""
        return hashTextByAlgorithm(input, algorithm)
    }, [algorithm, input, mode])

    const fileDigest = React.useMemo(() => {
        if (mode !== "file" || !fileBytes) return ""
        return hashBytes(fileBytes)[algorithm]
    }, [algorithm, fileBytes, mode])

    const hmacDigest = React.useMemo(() => {
        if (mode !== "hmac" || !enableHmac) return ""
        return resolveHmacDigest(hashHmac(input, secret), algorithm)
    }, [algorithm, enableHmac, input, mode, secret])

    const batchRows = React.useMemo(() => {
        if (mode !== "batch") return []
        return input
            .split(/\r?\n/g)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line, index) => ({
                index: index + 1,
                input: line,
                digest: hashTextByAlgorithm(line, algorithm),
            }))
    }, [algorithm, input, mode])

    const currentDigest = mode === "text"
        ? textDigest
        : mode === "file"
            ? fileDigest
            : mode === "hmac"
                ? hmacDigest
                : ""

    const output = React.useMemo(() => {
        const label = algorithmLabel(algorithm)
        if (mode === "batch") {
            return [
                `${t.common.hash_tool.algorithm}: ${label}`,
                `${t.common.hash_tool.mode}: ${t.common.hash_tool.mode_batch}`,
                `${t.common.hash_tool.input_rows}: ${batchRows.length}`,
                "",
                ...batchRows.map((row) => `${row.index}. ${row.input} => ${row.digest}`),
            ].join("\n")
        }

        if (mode === "file") {
            return [
                `${t.common.hash_tool.algorithm}: ${label}`,
                `${t.common.hash_tool.mode}: ${t.common.hash_tool.mode_file}`,
                `${t.common.hash_tool.file}: ${fileName || "(none)"}`,
                `${t.common.hash_tool.size}: ${fileSize} ${t.common.hash_tool.bytes}`,
                "",
                currentDigest || t.common.hash_tool.no_digest,
            ].join("\n")
        }

        if (mode === "hmac") {
            return [
                `${t.common.hash_tool.algorithm}: HMAC-${label}`,
                `${t.common.hash_tool.mode}: ${t.common.hash_tool.mode_hmac}`,
                `${t.common.hash_tool.input_length}: ${input.length}`,
                `${t.common.hash_tool.secret_length}: ${secret.length}`,
                "",
                currentDigest || t.common.hash_tool.no_digest,
            ].join("\n")
        }

        return [
            `${t.common.hash_tool.algorithm}: ${label}`,
            `${t.common.hash_tool.mode}: ${t.common.hash_tool.mode_text}`,
            `${t.common.hash_tool.input_length}: ${input.length}`,
            "",
            currentDigest || t.common.hash_tool.no_digest,
        ].join("\n")
    }, [algorithm, batchRows, currentDigest, fileName, fileSize, input.length, mode, secret.length, t.common.hash_tool])

    const handleSample = () => {
        if (mode === "batch") {
            setInput("item_001\nitem_002\nitem_003")
            return
        }
        setInput(sampleText)
        if (mode === "hmac") setSecret("shared_secret_001")
    }

    const handleReset = () => {
        setInput("")
        setSecret("")
        setFileName("")
        setFileSize(0)
        setFileBytes(null)
        setFileError(null)
        setMode("text")
    }

    const handleCopy = async () => {
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const handleDownload = () => {
        if (mode === "batch") {
            const csv = [
                "index,input,algorithm,digest",
                ...batchRows.map((row) => `${row.index},\"${row.input.replace(/\"/g, "\"\"")}\",${algorithm},${row.digest}`),
            ].join("\n")
            downloadTextFile(csv, `${algorithm}-batch.csv`)
            return
        }
        downloadTextFile(`${currentDigest}\n`, `${algorithm}-digest.txt`)
    }

    const handleFileSelect = async (file: File | null) => {
        if (!file) return
        const validation = validateFileAgainstPolicy(file, filePolicy)
        if (!validation.ok) {
            setFileBytes(null)
            setFileName("")
            setFileSize(0)
            setFileError(validation.message)
            return
        }
        try {
            const buffer = await readArrayBufferWithPolicy(file, filePolicy)
            setFileBytes(new Uint8Array(buffer))
            setFileName(file.name)
            setFileSize(file.size)
            setFileError(null)
        } catch {
            setFileBytes(null)
            setFileName("")
            setFileSize(0)
            setFileError(t.common.hash_tool.unable_read_file)
        }
    }

    const canDownload = mode === "batch" ? batchRows.length > 0 : Boolean(currentDigest)

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void handleCopy() },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload, disabled: !canDownload },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Fingerprint className="h-6 w-6 text-primary" />
                        {title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">{description}</p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            {weakAlgorithmWarning ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                    {weakAlgorithmWarning}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.hash_tool.mode}</div>
                        <div className="grid gap-2 border-t p-3 sm:grid-cols-2">
                            {visibleModes.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setMode(value)}
                                    className={`min-h-11 rounded-md border px-3 text-xs font-semibold uppercase tracking-wide ${
                                        mode === value
                                            ? "border-primary/40 bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {value === "text" ? t.common.hash_tool.mode_text : value === "file" ? t.common.hash_tool.mode_file : value === "hmac" ? t.common.hash_tool.mode_hmac : t.common.hash_tool.mode_batch}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.hash_tool.input}</div>
                        <div className="space-y-3 border-t p-3">
                            {mode === "file" ? (
                                <>
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                                        <span>{t.common.hash_tool.select_file}</span>
                                        <input
                                            type="file"
                                            accept={filePolicy.accept}
                                            className="hidden"
                                            onChange={(event) => {
                                                const file = event.target.files?.[0] || null
                                                void handleFileSelect(file)
                                            }}
                                        />
                                    </label>
                                    <div className="rounded-md border bg-background/80 p-3 text-xs text-muted-foreground">
                                        {fileName ? `${fileName} (${fileSize} ${t.common.hash_tool.bytes})` : t.common.hash_tool.no_file_selected}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{describeFilePolicy(filePolicy)}</div>
                                    {fileError ? <div className="text-xs text-red-600 dark:text-red-300">{fileError}</div> : null}
                                </>
                            ) : (
                                <Textarea
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    className="min-h-[180px] font-mono text-sm"
                                    placeholder={mode === "batch" ? t.common.hash_tool.one_line_per_item : t.common.hash_tool.type_or_paste}
                                    spellCheck={false}
                                />
                            )}

                            {mode === "hmac" ? (
                                <Input
                                    value={secret}
                                    onChange={(event) => setSecret(event.target.value)}
                                    placeholder={t.common.hash_tool.secret_key}
                                    spellCheck={false}
                                    className="font-mono text-sm"
                                />
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.hash_tool.output}</span>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-bold tracking-wider text-emerald-600/90 dark:text-emerald-400/90 uppercase">
                                    {t.common.hash_tool.live}
                                </span>
                            </div>
                            <span className="text-xs font-normal text-muted-foreground">{algorithmLabel(algorithm)}</span>
                        </div>
                    </div>
                    <div className="space-y-3 border-b bg-background/30 p-3">
                        <div className="rounded-lg border bg-background p-2">
                            <div className="max-h-[180px] overflow-auto break-all font-mono text-xs text-muted-foreground">
                                {mode === "batch"
                                    ? `${batchRows.length} ${t.common.hash_tool.rows_prepared}`
                                    : !currentDigest ? (
                                        <ToolEmptyState
                                            compact
                                            icon={Fingerprint}
                                            title={t.common.hash_tool.digest_will_appear}
                                        />
                                    ) : (
                                        currentDigest
                                    )}
                            </div>
                        </div>
                        <div className="rounded-md border bg-background p-2 text-xs text-muted-foreground">
                            <Button variant="link" className="h-auto p-0 text-xs" asChild>
                                <a href={`/${lang}/hash-generator`}>{t.common.hash_tool.open_workbench}</a>
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[260px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>

            <RelatedTools toolKey={relatedToolKey} />
        </div>
    )
}
