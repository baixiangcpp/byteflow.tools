"use client"

import * as React from "react"
import { Copy, Download, Eraser, Pipette, TestTube2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { FileUploadStatus, type FileUploadStatusState } from "@/features/tool-shell/file-upload-status"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { FILE_INPUT_POLICIES, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { createDemoImageDataUrl, fileToDataUrl, loadPolicyCheckedImage } from "@/core/utils/image-canvas-utils"
import { rgbToHex } from "@/core/utils/color-utils"

const IMAGE_FILE_POLICY = FILE_INPUT_POLICIES["image-standard"]

type PickedColor = {
    hex: string
    rgb: string
    x: number
    y: number
}

const DEFAULT_PICK: PickedColor = {
    hex: "#000000",
    rgb: "rgb(0, 0, 0)",
    x: 0,
    y: 0,
}

export function ImageColorPickerPage() {
    const { t } = useLang()
    const toolT = t.tools["image_color_picker"] as Record<string, string>
    const outputHexLabel = toolT.output_hex_label
    const outputRgbLabel = toolT.output_rgb_label
    const outputPositionLabel = toolT.output_position_label
    const pickedColorLabel = toolT.picked_color_label
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const demoSrcRef = React.useRef<string>("")
    const fileAbortControllerRef = React.useRef<AbortController | null>(null)

    const [imageSrc, setImageSrc] = React.useState("")
    const [fileName, setFileName] = React.useState("")
    const [picked, setPicked] = React.useState<PickedColor>(DEFAULT_PICK)
    const [uploadStatus, setUploadStatus] = React.useState<FileUploadStatusState>("idle")
    const [uploadMessage, setUploadMessage] = React.useState("")
    const [uploadProgress, setUploadProgress] = React.useState<number | undefined>(undefined)

    React.useEffect(() => {
        if (!demoSrcRef.current) demoSrcRef.current = createDemoImageDataUrl(1200, 700)
    }, [])

    const drawImageToCanvas = React.useCallback(async () => {
        const source = imageSrc || demoSrcRef.current
        if (!source || !canvasRef.current) return

        const image = await loadPolicyCheckedImage(source, IMAGE_FILE_POLICY)
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")
        if (!context) return

        const maxWidth = 980
        const ratio = Math.min(1, maxWidth / image.width)
        const width = Math.max(1, Math.round(image.width * ratio))
        const height = Math.max(1, Math.round(image.height * ratio))

        canvas.width = width
        canvas.height = height
        context.clearRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
    }, [imageSrc])

    React.useEffect(() => {
        void drawImageToCanvas()
    }, [drawImageToCanvas])

    const output = React.useMemo(
        () => [
            `${outputHexLabel}: ${picked.hex}`,
            `${outputRgbLabel}: ${picked.rgb}`,
            `${outputPositionLabel}: (${picked.x}, ${picked.y})`,
            "",
            ":root {",
            `  --picked-color: ${picked.hex};`,
            "}",
        ].join("\n"),
        [outputHexLabel, outputPositionLabel, outputRgbLabel, picked],
    )

    const pickAt = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const context = canvas.getContext("2d")
        if (!context) return

        const rect = canvas.getBoundingClientRect()
        const x = Math.max(0, Math.min(canvas.width - 1, Math.round(event.clientX - rect.left)))
        const y = Math.max(0, Math.min(canvas.height - 1, Math.round(event.clientY - rect.top)))
        const data = context.getImageData(x, y, 1, 1).data
        const hex = rgbToHex({ r: data[0], g: data[1], b: data[2] })
        const rgb = `rgb(${data[0]}, ${data[1]}, ${data[2]})`
        setPicked({ hex, rgb, x, y })
    }

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
            setUploadStatus("complete")
            setUploadMessage(t.common.file_ready_locally)
            setUploadProgress(100)
        } catch {
            if (controller.signal.aborted) return
            setUploadStatus("error")
            setUploadMessage(t.common.image_file_read_failed)
            setUploadProgress(undefined)
            toast.error(t.common.image_file_read_failed)
        }
    }

    const handleSample = () => {
        fileAbortControllerRef.current?.abort()
        setImageSrc("")
        setFileName(t.common.sample_image)
        setPicked(DEFAULT_PICK)
        setUploadStatus("complete")
        setUploadMessage(t.common.file_ready_locally)
        setUploadProgress(100)
    }

    const handleReset = () => {
        fileAbortControllerRef.current?.abort()
        setImageSrc("")
        setFileName("")
        setPicked(DEFAULT_PICK)
        setUploadStatus("idle")
        setUploadMessage("")
        setUploadProgress(undefined)
    }

    const cancelProcessing = () => {
        fileAbortControllerRef.current?.abort()
        setUploadStatus("cancelled")
        setUploadMessage(t.common.file_processing_cancelled)
        setUploadProgress(undefined)
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
        const canvas = document.createElement("canvas")
        canvas.width = 720
        canvas.height = 280
        const context = canvas.getContext("2d")
        if (!context) return

        context.fillStyle = picked.hex
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = "rgba(15, 23, 42, 0.8)"
        context.fillRect(40, 166, 440, 78)
        context.fillStyle = "#F8FAFC"
        context.font = "600 30px ui-sans-serif, system-ui"
        context.fillText(picked.hex, 62, 206)
        context.font = "400 20px ui-sans-serif, system-ui"
        context.fillText(picked.rgb, 62, 232)

        const anchor = document.createElement("a")
        anchor.href = canvas.toDataURL("image/png")
        anchor.download = "picked-color.png"
        anchor.click()
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: () => void handleCopy() },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Pipette className="h-6 w-6 text-primary" />
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
                        className="grid min-h-[340px] cursor-pointer place-items-center rounded-xl border border-dashed bg-muted/15 p-4"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault()
                            const file = event.dataTransfer.files?.[0]
                            if (file) void handleFile(file)
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            onClick={pickAt}
                            className="max-h-[320px] max-w-full rounded-lg border object-contain"
                        />
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
                        {!fileName ? (
                            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <Upload className="h-3.5 w-3.5" />
                                <span>{t.common.drop_image_or_click_upload}</span>
                            </div>
                        ) : null}
                    </div>

                    <FileUploadStatus
                        policy={IMAGE_FILE_POLICY}
                        status={uploadStatus}
                        message={uploadMessage}
                        progress={uploadProgress}
                        onCancel={uploadStatus === "loading" ? cancelProcessing : undefined}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground">
                            {t.common.file}: <span className="font-medium text-foreground">{fileName || (t.common.sample_image)}</span>
                        </div>
                        <div className="rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground">
                            {outputPositionLabel}: <span className="font-mono text-foreground">({picked.x}, {picked.y})</span>
                        </div>
                    </div>

                    <div className="rounded-lg border p-3">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{pickedColorLabel}</div>
                        <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-md border" style={{ background: picked.hex }} />
                            <div className="space-y-1 text-sm">
                                <div className="font-mono">{picked.hex}</div>
                                <div className="font-mono text-muted-foreground">{picked.rgb}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{toolT.output_format_label}</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[360px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
