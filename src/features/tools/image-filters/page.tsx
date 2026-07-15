"use client"

import * as React from "react"
import { Copy, Download, Eraser, SlidersHorizontal, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { FileUploadStatus, type FileUploadStatusState } from "@/features/tool-shell/file-upload-status"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { FILE_INPUT_POLICIES, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { createDemoImageDataUrl, fileToDataUrl, loadPolicyCheckedImage } from "@/core/utils/image-canvas-utils"
import { buildCssFilterString, type ImageFilterConfig } from "@/core/utils/image-edit-utils"
import { runImageEditTask } from "@/features/tool-processing/image-edit-task"
import { ToolPageContainer } from "@/components/layout/page-container"

const IMAGE_FILE_POLICY = FILE_INPUT_POLICIES["image-standard"]

const DEFAULT_FILTERS: ImageFilterConfig = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    blur: 0,
}

export function ImageFiltersPage() {
    const { t } = useLang()
    const toolT = t.tools["image_filters"] as Record<string, string>
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const demoSrcRef = React.useRef<string>("")
    const fileAbortControllerRef = React.useRef<AbortController | null>(null)
    const renderAbortControllerRef = React.useRef<AbortController | null>(null)
    const renderRequestIdRef = React.useRef(0)

    const [imageSrc, setImageSrc] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [filters, setFilters] = React.useState<ImageFilterConfig>(DEFAULT_FILTERS)
    const [outputDataUrl, setOutputDataUrl] = React.useState("")
    const [uploadStatus, setUploadStatus] = React.useState<FileUploadStatusState>("idle")
    const [uploadMessage, setUploadMessage] = React.useState("")
    const [uploadProgress, setUploadProgress] = React.useState<number | undefined>(undefined)
    const [isProcessing, setIsProcessing] = React.useState(false)
    const activeFileLabel = fileName || (imageSrc ? t.common.sample_image : t.common.drop_image_or_click_upload)

    React.useEffect(() => {
        if (!demoSrcRef.current) demoSrcRef.current = createDemoImageDataUrl(1280, 720)
    }, [])

    const filterCss = React.useMemo(() => buildCssFilterString(filters), [filters])

    React.useEffect(() => {
        const render = async () => {
            const source = imageSrc || demoSrcRef.current
            if (!source) return

            const requestId = renderRequestIdRef.current + 1
            renderRequestIdRef.current = requestId
            renderAbortControllerRef.current?.abort()
            const controller = new AbortController()
            renderAbortControllerRef.current = controller
            setIsProcessing(true)
            setUploadStatus("processing")
            setUploadMessage(t.common.processing_file_locally)
            setUploadProgress(65)

            await loadPolicyCheckedImage(source, IMAGE_FILE_POLICY)
            const result = await runImageEditTask({ operation: "filter", source, filters, maxWidth: 980 }, { signal: controller.signal })
            if (renderRequestIdRef.current !== requestId) return
            setOutputDataUrl(result.dataUrl)
            setUploadStatus("complete")
            setUploadMessage(t.common.file_ready_locally)
            setUploadProgress(100)
            setIsProcessing(false)
        }

        void render().catch((error) => {
            if (error instanceof Error && (error.message === "FILE_READ_ABORTED" || error.message === "WORKER_ABORTED")) return
            setOutputDataUrl("")
            setUploadStatus("error")
            setUploadMessage(error instanceof Error ? error.message : t.common.image_process_failed)
            setUploadProgress(undefined)
            setIsProcessing(false)
        })

        return () => {
            renderAbortControllerRef.current?.abort()
        }
    }, [filters, imageSrc, t.common.file_ready_locally, t.common.image_process_failed, t.common.processing_file_locally])

    const output = React.useMemo(
        () =>
            [
                "filter:",
                filterCss + ";",
                "",
                ".preview-image {",
                `  filter: ${filterCss};`,
                "}",
            ].join("\n"),
        [filterCss],
    )

    const handleFile = async (file: File) => {
        const validation = validateFileAgainstPolicy(file, IMAGE_FILE_POLICY)
        if (!validation.ok) {
            setUploadStatus("error")
            setUploadMessage(validation.message)
            setUploadProgress(undefined)
            toast.error(validation.reason === "unsupported_type" ? t.common.image_file_required : validation.message)
            return
        }
        fileAbortControllerRef.current?.abort()
        const controller = new AbortController()
        fileAbortControllerRef.current = controller
        setUploadStatus("loading")
        setUploadMessage(t.common.loading_file_locally)
        setUploadProgress(25)
        try {
            const src = await fileToDataUrl(file, IMAGE_FILE_POLICY, { signal: controller.signal })
            await loadPolicyCheckedImage(src, IMAGE_FILE_POLICY)
            if (controller.signal.aborted) return
            setImageSrc(src)
            setFileName(file.name)
            setUploadStatus("processing")
            setUploadMessage(t.common.processing_file_locally)
            setUploadProgress(50)
        } catch {
            if (controller.signal.aborted) return
            setUploadStatus("error")
            setUploadMessage(t.common.image_file_read_failed)
            setUploadProgress(undefined)
            toast.error(t.common.image_file_read_failed)
        }
    }

    const cancelProcessing = () => {
        fileAbortControllerRef.current?.abort()
        renderAbortControllerRef.current?.abort()
        renderRequestIdRef.current += 1
        setIsProcessing(false)
        setUploadStatus("cancelled")
        setUploadMessage(t.common.file_processing_cancelled)
        setUploadProgress(undefined)
    }

    const handleSample = () => {
        setImageSrc(demoSrcRef.current)
        setFileName("")
        setFilters({
            brightness: 112,
            contrast: 118,
            saturation: 138,
            grayscale: 0,
            blur: 0,
        })
        setUploadStatus("complete")
        setUploadMessage(t.common.file_ready_locally)
        setUploadProgress(100)
    }

    const handleReset = () => {
        cancelProcessing()
        setImageSrc("")
        setFileName("")
        setFilters(DEFAULT_FILTERS)
        setUploadStatus("idle")
        setUploadMessage("")
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
        if (!outputDataUrl) return
        const anchor = document.createElement("a")
        anchor.href = outputDataUrl
        anchor.download = "filtered-image.png"
        anchor.click()
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy, disabled: isProcessing },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload, disabled: isProcessing || !outputDataUrl },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <SlidersHorizontal className="h-6 w-6 text-primary" />
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
                        className="grid min-h-[320px] cursor-pointer place-items-center rounded-xl border border-dashed bg-muted/15 p-4"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault()
                            const file = event.dataTransfer.files?.[0]
                            if (file) void handleFile(file)
                        }}
                    >
                        {outputDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={outputDataUrl} alt={toolT.preview_alt} className="max-h-[300px] max-w-full rounded-lg border object-contain" />
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <Upload className="mx-auto mb-3 h-10 w-10 opacity-60" />
                                <p className="text-sm font-medium">{t.common.drop_image_or_click_upload}</p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={IMAGE_FILE_POLICY.accept}
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) void handleFile(file)
                            }}
                        />
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <Upload className="h-3.5 w-3.5" />
                            <span>{activeFileLabel}</span>
                        </div>
                    </div>

                    <FileUploadStatus
                        policy={IMAGE_FILE_POLICY}
                        status={uploadStatus}
                        message={uploadMessage}
                        progress={uploadProgress}
                        onCancel={isProcessing || uploadStatus === "loading" ? cancelProcessing : undefined}
                    />

                    <div className="rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground">
                        {t.common.file}: <span className="font-medium text-foreground">{fileName || (t.common.sample_image)}</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <RangeField
                            label={t.common.brightness}
                            value={filters.brightness}
                            min={0}
                            max={250}
                            step={1}
                            suffix="%"
                            onChange={(value) => setFilters((prev) => ({ ...prev, brightness: value }))}
                        />
                        <RangeField
                            label={t.common.contrast}
                            value={filters.contrast}
                            min={0}
                            max={250}
                            step={1}
                            suffix="%"
                            onChange={(value) => setFilters((prev) => ({ ...prev, contrast: value }))}
                        />
                        <RangeField
                            label={t.common.saturation}
                            value={filters.saturation}
                            min={0}
                            max={300}
                            step={1}
                            suffix="%"
                            onChange={(value) => setFilters((prev) => ({ ...prev, saturation: value }))}
                        />
                        <RangeField
                            label={t.common.grayscale}
                            value={filters.grayscale}
                            min={0}
                            max={100}
                            step={1}
                            suffix="%"
                            onChange={(value) => setFilters((prev) => ({ ...prev, grayscale: value }))}
                        />
                        <RangeField
                            label={t.common.blur}
                            value={filters.blur}
                            min={0}
                            max={20}
                            step={0.1}
                            suffix="px"
                            onChange={(value) => setFilters((prev) => ({ ...prev, blur: value }))}
                        />
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{t.common.preview_css}</span>
                    </div>
                    <div className="border-b">
                        <ToolPreviewArea
                            title={t.common.preview}
                            metadata={outputDataUrl ? filterCss : undefined}
                        >
                            {outputDataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={outputDataUrl}
                                    alt={toolT.preview_alt}
                                    className="max-h-[400px] w-auto rounded object-contain drop-shadow-md"
                                />
                            ) : (
                                <div className="text-xs text-muted-foreground">
                                    {t.common.preview_will_appear_here}
                                </div>
                            )}
                        </ToolPreviewArea>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[280px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </ToolPageContainer>
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
                <span>{value.toFixed(step < 1 ? 1 : 0)}{suffix}</span>
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
