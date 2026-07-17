"use client"

import * as React from "react"
import { Copy, Download, Eraser, ListChecks, Play, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { copyTextWithLazyToolFeedback } from "@/features/tool-shell/lazy-tool-action-feedback"
import { InlineToolActionFeedback, useInlineToolActionFeedback } from "@/features/tool-shell/inline-tool-action-feedback"
import { readStorageJson, writeStorageJson } from "@/core/storage/tool-persistence"
import { importTextFile, TEXT_FILE_IMPORT_ACCEPT } from "@/core/files/text-file-import"
import { randomizeList, type RandomizeMode } from "@/features/tools/list-randomizer/utils"
import { ToolPageContainer } from "@/components/layout/page-container"

const SAMPLE_INPUT = ["alpha", "beta", "charlie", "delta", "echo", "foxtrot", "golf", "hotel"].join("\n")
const STORAGE_KEY = "byteflow:list-randomizer:state"

type PersistedPreferences = {
    mode: RandomizeMode
    sampleCount: number
    dedupe: boolean
    withReplacement: boolean
}

type ToolStateDefaults = PersistedPreferences & {
    input: string
    seed: string
}

const DEFAULT_STATE: ToolStateDefaults = {
    input: SAMPLE_INPUT,
    mode: "shuffle",
    sampleCount: 3,
    dedupe: false,
    withReplacement: false,
    seed: "42",
}

function normalizePersistedPreferences(value: unknown): PersistedPreferences | null {
    if (!value || typeof value !== "object") return null
    const candidate = value as Partial<PersistedPreferences>
    const mode = candidate.mode === "sample" ? "sample" : candidate.mode === "shuffle" ? "shuffle" : null
    if (mode === null) return null

    return {
        mode,
        sampleCount: Number.isFinite(candidate.sampleCount) && Number(candidate.sampleCount) >= 1
            ? Number(candidate.sampleCount)
            : DEFAULT_STATE.sampleCount,
        dedupe: Boolean(candidate.dedupe),
        withReplacement: Boolean(candidate.withReplacement),
    }
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

export function ListRandomizerPage() {
    const { t } = useLang()
    const toolT = t.tools["list_randomizer"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key], [toolT])

    const [input, setInput] = React.useState(DEFAULT_STATE.input)
    const [mode, setMode] = React.useState<RandomizeMode>(DEFAULT_STATE.mode)
    const [sampleCount, setSampleCount] = React.useState(DEFAULT_STATE.sampleCount)
    const [dedupe, setDedupe] = React.useState(DEFAULT_STATE.dedupe)
    const [withReplacement, setWithReplacement] = React.useState(DEFAULT_STATE.withReplacement)
    const [seed, setSeed] = React.useState(DEFAULT_STATE.seed)
    const [items, setItems] = React.useState<string[]>([])
    const [sourceCount, setSourceCount] = React.useState(0)
    const [hydrated, setHydrated] = React.useState(false)
    const [importError, setImportError] = React.useState<string | null>(null)
    const [isImportDragActive, setIsImportDragActive] = React.useState(false)
    const { feedback: copyFeedback, run: runCopyAction } = useInlineToolActionFeedback()
    const fileInputRef = React.useRef<HTMLInputElement | null>(null)

    React.useEffect(() => {
        const saved = normalizePersistedPreferences(readStorageJson<unknown>(STORAGE_KEY, null))
        if (saved) {
            setMode(saved.mode)
            setSampleCount(saved.sampleCount)
            setDedupe(saved.dedupe)
            setWithReplacement(saved.withReplacement)
        }
        setHydrated(true)
    }, [])

    React.useEffect(() => {
        if (!hydrated) return

        writeStorageJson<PersistedPreferences>(STORAGE_KEY, {
            mode,
            sampleCount,
            dedupe,
            withReplacement,
        })
    }, [dedupe, hydrated, mode, sampleCount, withReplacement])

    const runRandomizer = React.useCallback(() => {
        const result = randomizeList({
            input,
            mode,
            dedupe,
            sampleCount,
            withReplacement,
            seed,
        })
        setItems(result.items)
        setSourceCount(result.sourceCount)
        return result
    }, [dedupe, input, mode, sampleCount, seed, withReplacement])

    React.useEffect(() => {
        const result = runRandomizer()
        setItems(result.items)
    }, [runRandomizer])

    const output = React.useMemo(
        () =>
            [
                `${text("output_mode")}: ${mode === "shuffle" ? text("mode_shuffle") : text("mode_sample")}`,
                `${text("output_source_items")}: ${sourceCount}`,
                `${text("output_result_items")}: ${items.length}`,
                `${text("output_dedupe")}: ${dedupe ? text("yes") : text("no")}`,
                `${text("output_with_replacement")}: ${withReplacement ? text("yes") : text("no")}`,
                `${text("output_sample_count")}: ${sampleCount}`,
                `${text("output_seed")}: ${seed || text("none")}`,
                "",
                ...items.map((item, index) => `${index + 1}. ${item}`),
            ].join("\n"),
        [dedupe, items, mode, sampleCount, seed, sourceCount, text, withReplacement],
    )

    const handleRandomize = () => {
        const result = runRandomizer()
        toast.success(text("randomize_success").replace("{count}", String(result.items.length)))
    }

    const handleSample = () => {
        setInput(SAMPLE_INPUT)
        setMode("shuffle")
        setSampleCount(3)
        setDedupe(false)
        setWithReplacement(false)
        setSeed(DEFAULT_STATE.seed)
    }

    const handleReset = () => {
        setInput("")
        setMode("shuffle")
        setSampleCount(1)
        setDedupe(false)
        setWithReplacement(false)
        setSeed("")
        setItems([])
        setSourceCount(0)
    }

    const handleImportFile = async (file: File) => {
        try {
            const content = await importTextFile(file)
            setInput(content)
            setImportError(null)
            toast.success(text("file_imported"), { description: file.name })
        } catch (error) {
            const message = error instanceof Error ? error.message : text("file_import_failed")
            setImportError(message)
        }
    }

    const openImportPicker = () => {
        fileInputRef.current?.click()
    }

    const handleCopy = async () => {
        const result = await runCopyAction(() => copyTextWithLazyToolFeedback(
            t,
            output,
            t.common.output,
        ))
        return result.announce ? { ...result, announce: false } : result
    }

    const handleDownload = () => downloadTextFile(output, "randomized-list.txt")

    const actions: ToolAction[] = [
        { id: "import_file", label: text("import_file"), icon: Upload, onClick: openImportPicker },
        { id: "sample", label: text("sample_action"), icon: TestTube2, onClick: handleSample },
        { id: "randomize", label: text("randomize_action"), icon: Play, onClick: handleRandomize },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload, disabled: items.length === 0 },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <ListChecks className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <InlineToolActionFeedback feedback={copyFeedback} />

            <div
                className={`rounded-xl border border-dashed px-4 py-3 transition-colors ${isImportDragActive ? "border-primary bg-primary/10" : "border-border/70 bg-card/40"}`}
                onDragOver={(event) => {
                    event.preventDefault()
                    setIsImportDragActive(true)
                }}
                onDragLeave={(event) => {
                    event.preventDefault()
                    setIsImportDragActive(false)
                }}
                onDrop={(event) => {
                    event.preventDefault()
                    setIsImportDragActive(false)
                    const file = event.dataTransfer.files?.[0]
                    if (!file) return
                    void handleImportFile(file)
                }}
            >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        {text("drag_drop_import_hint")}
                    </p>
                    <button
                        type="button"
                        onClick={openImportPicker}
                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-border/70 bg-background/70 px-3 text-sm transition-colors hover:border-primary/35 hover:text-foreground"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {text("import_file")}
                    </button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={TEXT_FILE_IMPORT_ACCEPT}
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.currentTarget.value = ""
                        if (!file) return
                        void handleImportFile(file)
                    }}
                />
            </div>

            {importError ? (
                <div className="rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">
                    {importError}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{text("input_list")}</div>
                        <div className="space-y-3 border-t p-3">
                            <Textarea
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                className="min-h-[220px] font-mono text-sm"
                                placeholder={text("input_placeholder")}
                                spellCheck={false}
                            />
                            <div className="text-xs text-muted-foreground">{text("input_hint")}</div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{text("randomization_options")}</div>
                        <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3 sm:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{text("mode_label")}</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["shuffle", "sample"] as RandomizeMode[]).map((value) => (
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
                                            {value === "shuffle" ? text("mode_shuffle") : text("mode_sample")}
                                        </button>
                                    ))}
                                </div>
                            </label>

                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{text("sample_count")}</span>
                                <Input
                                    type="number"
                                    min={1}
                                    max={1000}
                                    value={sampleCount}
                                    onChange={(event) => setSampleCount(Number(event.target.value) || 1)}
                                    disabled={mode !== "sample"}
                                />
                            </label>

                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{text("seed_optional")}</span>
                                <Input value={seed} onChange={(event) => setSeed(event.target.value)} spellCheck={false} />
                            </label>

                            <label className="flex min-h-11 items-center gap-2 rounded-md border bg-background/80 px-3 text-sm">
                                <input type="checkbox" checked={dedupe} onChange={(event) => setDedupe(event.target.checked)} className="h-4 w-4" />
                                {text("remove_duplicates")}
                            </label>
                            <label className="flex min-h-11 items-center gap-2 rounded-md border bg-background/80 px-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={withReplacement}
                                    onChange={(event) => setWithReplacement(event.target.checked)}
                                    disabled={mode !== "sample"}
                                    className="h-4 w-4"
                                />
                                {text("sample_with_replacement")}
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{text("result_list")}</span>
                    </div>
                    <div className="space-y-3 border-b bg-background/30 p-3">
                        <div className="rounded-lg border bg-background p-3">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{text("preview")}</div>
                            <div className="max-h-40 space-y-1 overflow-auto font-mono text-xs">
                                {items.length > 0 ? (
                                    items.map((item, index) => (
                                        <div key={`${item}-${index}`} className="rounded border bg-background/80 px-2 py-1">
                                            {index + 1}. {item}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-muted-foreground">{text("no_output")}</div>
                                )}
                            </div>
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

            <RelatedTools toolKey="list_randomizer" />
        </ToolPageContainer>
    )
}
