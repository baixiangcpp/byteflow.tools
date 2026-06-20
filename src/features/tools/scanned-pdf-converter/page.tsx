"use client"

import * as React from "react"
import { Copy, Download, Eraser, FileImage, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { FILE_INPUT_POLICIES, filterFilesByPolicy, formatFilePolicyLimit } from "@/core/files/file-input-policy"
import {
    type ScanEnhanceConfig,
} from "@/features/tools/scanned-pdf-converter/utils"
import { runScanEnhanceTask } from "@/features/tools/scanned-pdf-converter/scan-enhance-task"
import { downloadPdfBytes, loadScanImageFile } from "@/features/tools/scanned-pdf-converter/browser-actions"

const SCAN_FILE_POLICY = FILE_INPUT_POLICIES["scan-image"]
const MAX_FILES = SCAN_FILE_POLICY.maxFiles ?? 20
let pdfLibPromise: Promise<typeof import("pdf-lib")> | null = null

type ScanPage = {
    id: string
    name: string
    src: string
    bytes?: ArrayBuffer
    mime?: string
    width: number
    height: number
}

const DEFAULT_ENHANCE: ScanEnhanceConfig = {
    brightness: 120,
    contrast: 145,
    grayscale: 100,
    thresholdEnabled: true,
    threshold: 165,
}

async function buildSampleScanPage(title: string, subtitle: string): Promise<ScanPage> {
    const canvas = document.createElement("canvas")
    canvas.width = 1240
    canvas.height = 1754
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas context unavailable")

    context.fillStyle = "#f8fafc"
    context.fillRect(0, 0, canvas.width, canvas.height)

    context.fillStyle = "#e2e8f0"
    for (let y = 80; y < canvas.height - 80; y += 62) {
        context.fillRect(80, y, canvas.width - 160, 2)
    }

    context.fillStyle = "#0f172a"
    context.font = "700 52px ui-sans-serif, system-ui"
    context.fillText(title, 88, 156)

    context.fillStyle = "#334155"
    context.font = "400 30px ui-sans-serif, system-ui"
    context.fillText(subtitle, 88, 208)

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
    return {
        id: crypto.randomUUID(),
        name: `${title.replace(/\s+/g, "-").toLowerCase()}.jpg`,
        src: dataUrl,
        width: canvas.width,
        height: canvas.height,
    }
}

async function loadPdfLib() {
    pdfLibPromise ??= import("pdf-lib")
    return pdfLibPromise
}

export function ScannedPdfConverterPage() {
    const { t } = useLang()
    const toolT = t.tools["scanned_pdf_converter"] as Record<string, string>
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const previewRequestIdRef = React.useRef(0)
    const previewAbortControllerRef = React.useRef<AbortController | null>(null)
    const objectUrlsRef = React.useRef<string[]>([])

    const [pages, setPages] = React.useState<ScanPage[]>([])
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const [enhance, setEnhance] = React.useState<ScanEnhanceConfig>(DEFAULT_ENHANCE)
    const [previewSrc, setPreviewSrc] = React.useState("")
    const [isBusy, setIsBusy] = React.useState(false)

    const selectedPage = pages[selectedIndex]

    const revokeObjectUrls = React.useCallback(() => {
        for (const url of objectUrlsRef.current) {
            URL.revokeObjectURL(url)
        }
        objectUrlsRef.current = []
    }, [])

    React.useEffect(() => revokeObjectUrls, [revokeObjectUrls])

    React.useEffect(() => {
        const requestId = previewRequestIdRef.current + 1
        previewRequestIdRef.current = requestId
        previewAbortControllerRef.current?.abort()
        const controller = new AbortController()
        previewAbortControllerRef.current = controller

        const renderPreview = async () => {
            if (!selectedPage) {
                previewAbortControllerRef.current = null
                setPreviewSrc("")
                return
            }
            try {
                const result = await runScanEnhanceTask({
                    source: selectedPage.src,
                    sourceBytes: selectedPage.bytes?.slice(0),
                    sourceMime: selectedPage.mime,
                    enhance,
                }, { signal: controller.signal })
                if (previewRequestIdRef.current === requestId) {
                    setPreviewSrc(result.dataUrl)
                }
            } catch {
                if (previewRequestIdRef.current === requestId) {
                    setPreviewSrc("")
                }
            }
        }

        void renderPreview()

        return () => {
            controller.abort()
        }
    }, [enhance, selectedPage])

    const output = React.useMemo(
        () =>
            [
                `${toolT.pages_label}: ${pages.length}`,
                `${toolT.selected_label}: ${selectedPage ? selectedPage.name : "-"}`,
                `${t.common.brightness}: ${enhance.brightness}%`,
                `${t.common.contrast}: ${enhance.contrast}%`,
                `${t.common.grayscale}: ${enhance.grayscale}%`,
                `${toolT.threshold_label}: ${enhance.thresholdEnabled ? `${enhance.threshold} (${t.common.enabled})` : t.common.disabled}`,
                "",
                toolT.export_all_pages_note,
            ].join("\n"),
        [enhance.brightness, enhance.contrast, enhance.grayscale, enhance.threshold, enhance.thresholdEnabled, pages.length, selectedPage, t.common, toolT],
    )

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        const { accepted } = filterFilesByPolicy(Array.from(files), SCAN_FILE_POLICY)
        const results: ScanPage[] = []
        const nextObjectUrls: string[] = []

        for (const file of accepted) {
            const loaded = await loadScanImageFile(file)
            nextObjectUrls.push(loaded.objectUrl)
            results.push({
                id: crypto.randomUUID(),
                name: loaded.name,
                src: loaded.objectUrl,
                bytes: loaded.bytes,
                mime: loaded.mime,
                width: loaded.width,
                height: loaded.height,
            })
        }

        if (results.length === 0) {
            toast.error(t.common.no_valid_image_files_loaded)
            return
        }

        revokeObjectUrls()
        objectUrlsRef.current = nextObjectUrls
        setPages(results)
        setSelectedIndex(0)
    }

    const handleSample = async () => {
        const first = await buildSampleScanPage("BF-001", "01 / 02")
        const second = await buildSampleScanPage("BF-002", "02 / 02")
        revokeObjectUrls()
        setPages([first, second])
        setSelectedIndex(0)
        setEnhance(DEFAULT_ENHANCE)
    }

    const handleReset = () => {
        revokeObjectUrls()
        setPages([])
        setSelectedIndex(0)
        setEnhance(DEFAULT_ENHANCE)
        setPreviewSrc("")
    }

    const handleCopy = async () => {
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const handleDownload = async () => {
        if (pages.length === 0 || isBusy) return
        setIsBusy(true)
        try {
            const { PDFDocument } = await loadPdfLib()
            const pdf = await PDFDocument.create()

            for (const page of pages) {
                const enhanced = await runScanEnhanceTask({
                    source: page.src,
                    sourceBytes: page.bytes?.slice(0),
                    sourceMime: page.mime,
                    enhance,
                })
                const imageBytes = new Uint8Array(enhanced.bytes)
                const jpg = await pdf.embedJpg(imageBytes)
                const pdfPage = pdf.addPage([jpg.width, jpg.height])
                pdfPage.drawImage(jpg, {
                    x: 0,
                    y: 0,
                    width: jpg.width,
                    height: jpg.height,
                })
            }

            downloadPdfBytes(new Uint8Array(await pdf.save()), "scanned-document.pdf")
        } catch {
            toast.error(t.common.export_pdf_failed)
        } finally {
            setIsBusy(false)
        }
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: () => void handleSample() },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void handleCopy() },
        { id: "download", label: isBusy ? toolT.exporting : t.common.download, icon: Download, onClick: () => void handleDownload(), disabled: pages.length === 0 || isBusy },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <FileImage className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div
                        className="grid min-h-[220px] cursor-pointer place-items-center rounded-xl border border-dashed bg-muted/15 p-4"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault()
                            void handleFiles(event.dataTransfer.files)
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={SCAN_FILE_POLICY.accept}
                            className="hidden"
                            onChange={(event) => void handleFiles(event.target.files)}
                        />
                        <div className="text-center text-muted-foreground">
                            <Upload className="mx-auto mb-3 h-10 w-10 opacity-60" />
                            <p className="text-sm font-medium">{toolT.drop_scanned_images_or_click_upload}</p>
                            <p className="mt-1 text-xs">{toolT.upload_limit_hint.replace("{count}", String(MAX_FILES)).replace("{size}", formatFilePolicyLimit(SCAN_FILE_POLICY))}</p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <RangeField
                            label={t.common.brightness}
                            value={enhance.brightness}
                            min={40}
                            max={200}
                            step={1}
                            suffix="%"
                            onChange={(value) => setEnhance((prev) => ({ ...prev, brightness: value }))}
                        />
                        <RangeField
                            label={t.common.contrast}
                            value={enhance.contrast}
                            min={40}
                            max={260}
                            step={1}
                            suffix="%"
                            onChange={(value) => setEnhance((prev) => ({ ...prev, contrast: value }))}
                        />
                        <RangeField
                            label={t.common.grayscale}
                            value={enhance.grayscale}
                            min={0}
                            max={100}
                            step={1}
                            suffix="%"
                            onChange={(value) => setEnhance((prev) => ({ ...prev, grayscale: value }))}
                        />
                        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <span>{toolT.threshold_label}</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setEnhance((prev) => ({
                                            ...prev,
                                            thresholdEnabled: !prev.thresholdEnabled,
                                        }))
                                    }
                                    className={`rounded border px-2 py-0.5 text-[10px] ${
                                        enhance.thresholdEnabled
                                            ? "border-primary/40 bg-primary/10 text-primary"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {enhance.thresholdEnabled ? t.common.on : t.common.off}
                                </button>
                            </div>
                            <Input
                                type="range"
                                min={0}
                                max={255}
                                step={1}
                                value={enhance.threshold}
                                disabled={!enhance.thresholdEnabled}
                                onChange={(event) => setEnhance((prev) => ({ ...prev, threshold: Number(event.target.value) }))}
                                className="cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="text-xs text-muted-foreground">{enhance.threshold}</div>
                        </div>
                    </div>

                    <div className="space-y-2 rounded-lg border bg-background/60 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.pages_heading.replace("{count}", String(pages.length))}</div>
                        <div className="max-h-[220px] space-y-1 overflow-auto pr-1">
                            {pages.length === 0 ? (
                                <div className="rounded-md border px-2 py-1 text-xs text-muted-foreground">{toolT.no_pages_loaded}</div>
                            ) : (
                                pages.map((page, index) => (
                                    <button
                                        key={page.id}
                                        type="button"
                                        onClick={() => setSelectedIndex(index)}
                                        className={`flex min-h-11 w-full items-center justify-between rounded-md border px-2 text-left text-xs ${
                                            selectedIndex === index
                                                ? "border-primary/40 bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <span className="truncate pr-2">{index + 1}. {page.name}</span>
                                        <span className="font-mono opacity-80">{page.width}x{page.height}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header">
                        <span>{t.common.output}</span>
                    </div>
                    <ToolPreviewArea
                        title={t.common.preview}
                        metadata={selectedPage ? `${selectedPage.width}x${selectedPage.height} px` : undefined}
                    >
                        {previewSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={previewSrc} alt={toolT.title} className="max-h-[400px] w-auto rounded object-contain drop-shadow-md" />
                        ) : (
                            <div className="grid h-[180px] place-items-center text-xs text-muted-foreground italic">
                                {t.common.preview_will_appear_here}
                            </div>
                        )}
                    </ToolPreviewArea>
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
        </div>
    )
}

function RangeField({
    label,
    value,
    min,
    max,
    step,
    suffix,
    onChange,
}: {
    label: string
    value: number
    min: number
    max: number
    step: number
    suffix: string
    onChange: (value: number) => void
}) {
    return (
        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{label}</span>
                <span>{value}{suffix}</span>
            </div>
            <Input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="cursor-pointer"
            />
        </div>
    )
}
