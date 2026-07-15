"use client"

import * as React from "react"
import { Copy, Download, ExternalLink, FileImage, ImagePlus, LoaderCircle, QrCode, RotateCcw, ScanLine, TestTube2, Trash2, Upload } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ToolActionBar, type ToolAction, type ToolActionResult } from "@/features/tool-shell/tool-action-bar"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { FILE_INPUT_POLICIES, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { parseSafeExternalUrl } from "@/core/security/external-url"
import {
    buildQrSvg,
    decodeQrImageFile,
    downloadCanvasPng,
    downloadSvg as downloadSvgFile,
    drawRoundedRect,
    loadImage,
    loadQRCode,
    loadToast,
    readFileAsDataUrl,
} from "./browser-actions"
import { BUTTON_BASE_CLASS, BUTTON_SIZE_CLASS, BUTTON_VARIANT_CLASS, DEFAULT_QR_TEXT, PRESETS, SAMPLE_QR_TEXT } from "./constants"
import type { ErrorCorrectionLevel, QrPreset } from "./types"

const LOGO_FILE_POLICY = FILE_INPUT_POLICIES["image-logo"]
const QR_DECODE_FILE_POLICY = FILE_INPUT_POLICIES["qr-decode-image"]

type QrMode = "generate" | "decode"
type DecodeStatus = "idle" | "decoding" | "success" | "error"

const DECODE_ERROR_KEYS = {
    empty_file: "decode_empty_file",
    too_large: "decode_too_large",
    unsupported_type: "decode_unsupported",
    image_too_large: "decode_dimensions_too_large",
    image_load_failed: "decode_image_failed",
    canvas_unavailable: "decode_image_failed",
    decoder_unavailable: "decode_decoder_unavailable",
    no_qr: "decode_no_qr",
} as const

function joinClasses(...values: Array<string | null | undefined | false>) {
    return values.filter(Boolean).join(" ")
}

type InlineButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof BUTTON_VARIANT_CLASS
}

function InlineButton({
    className,
    type = "button",
    variant = "outline",
    ...props
}: InlineButtonProps) {
    return (
        <button
            type={type}
            className={joinClasses(BUTTON_BASE_CLASS, BUTTON_VARIANT_CLASS[variant], BUTTON_SIZE_CLASS.sm, className)}
            {...props}
        />
    )
}

export function QrCodeGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["qr_code_generator"] as Record<string, string>
    const textFor = (key: string) => toolT[key]
    const notifyError = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.error(message)
    }, [])
    const notifySuccess = React.useCallback(async (message: string, description?: string) => {
        const toast = await loadToast()
        toast.success(message, description ? { description } : undefined)
    }, [])

    const [text, setText] = React.useState(DEFAULT_QR_TEXT)
    const [size, setSize] = React.useState(256)
    const [margin, setMargin] = React.useState(2)
    const [errorCorrectionLevel, setErrorCorrectionLevel] = React.useState<ErrorCorrectionLevel>("H")
    const [fgColor, setFgColor] = React.useState("#ffffff")
    const [bgColor, setBgColor] = React.useState("#0a0a1a")
    const [logoEnabled, setLogoEnabled] = React.useState(false)
    const [logoDataUrl, setLogoDataUrl] = React.useState<string | null>(null)
    const [logoName, setLogoName] = React.useState("")
    const [logoScale, setLogoScale] = React.useState(22)
    const [activePreset, setActivePreset] = React.useState("default")
    const [dataUrl, setDataUrl] = React.useState("")
    const [mode, setMode] = React.useState<QrMode>("generate")
    const [decodeStatus, setDecodeStatus] = React.useState<DecodeStatus>("idle")
    const [decodedPayload, setDecodedPayload] = React.useState("")
    const [decodeError, setDecodeError] = React.useState("")
    const [decodeFileName, setDecodeFileName] = React.useState("")
    const [decodeDragActive, setDecodeDragActive] = React.useState(false)

    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const logoInputRef = React.useRef<HTMLInputElement>(null)
    const decodeInputRef = React.useRef<HTMLInputElement>(null)
    const decodeRequestRef = React.useRef(0)

    const decodedUrl = React.useMemo(() => {
        const parsed = parseSafeExternalUrl(decodedPayload, { requireHttps: false })
        return parsed.ok ? parsed.url : null
    }, [decodedPayload])

    const renderToCanvas = React.useCallback(async () => {
        if (!text.trim()) {
            setDataUrl("")
            return
        }

        const canvas = canvasRef.current
        if (!canvas) return

        const qrCode = await loadQRCode()

        await qrCode.toCanvas(canvas, text, {
            width: size,
            margin,
            errorCorrectionLevel,
            color: {
                dark: fgColor,
                light: bgColor,
            },
        })

        if (logoEnabled && logoDataUrl) {
            const ctx = canvas.getContext("2d")
            if (ctx) {
                const img = await loadImage(logoDataUrl)
                const logoSize = Math.floor((size * logoScale) / 100)
                const x = (size - logoSize) / 2
                const y = (size - logoSize) / 2
                const padding = Math.max(4, Math.floor(logoSize * 0.12))
                const radius = Math.max(5, Math.floor(logoSize * 0.15))

                ctx.save()
                drawRoundedRect(ctx, x - padding, y - padding, logoSize + padding * 2, logoSize + padding * 2, radius)
                ctx.fillStyle = "rgba(255,255,255,0.94)"
                ctx.fill()
                ctx.drawImage(img, x, y, logoSize, logoSize)
                ctx.restore()
            }
        }

        setDataUrl(canvas.toDataURL("image/png"))
    }, [bgColor, errorCorrectionLevel, fgColor, logoDataUrl, logoEnabled, logoScale, margin, size, text])

    React.useEffect(() => {
        let cancelled = false
        void (async () => {
            try {
                await renderToCanvas()
            } catch {
                if (!cancelled) {
                    setDataUrl("")
                }
            }
        })()
        return () => {
            cancelled = true
        }
    }, [renderToCanvas])

    const applyPreset = (preset: QrPreset) => {
        setSize(preset.size)
        setMargin(preset.margin)
        setErrorCorrectionLevel(preset.errorCorrectionLevel)
        setFgColor(preset.fgColor)
        setBgColor(preset.bgColor)
        setLogoScale(preset.logoScale)
        setActivePreset(preset.id)
    }

    const handleLogoUpload = async (file: File | null) => {
        if (!file) return

        const validation = validateFileAgainstPolicy(file, LOGO_FILE_POLICY)
        if (!validation.ok) {
            await notifyError(textFor(validation.reason === "too_large" ? "logo_too_large" : "logo_invalid"))
            return
        }

        try {
            const dataUrl = await readFileAsDataUrl(file)
            setLogoDataUrl(dataUrl)
            setLogoName(file.name)
            setLogoEnabled(true)
        } catch {
            await notifyError(textFor("logo_invalid"))
        }
    }

    const handleRemoveLogo = () => {
        setLogoDataUrl(null)
        setLogoName("")
        setLogoEnabled(false)
    }

    const downloadPng = async (): Promise<ToolActionResult> => {
        const canvas = canvasRef.current
        if (!dataUrl || !canvas) {
            return { status: "failed", message: textFor("download_error") }
        }

        const result = await downloadCanvasPng(canvas, "qr-code.png")
        if (result.ok) {
            await notifySuccess(textFor("downloaded_png"))
            return { status: "success", message: textFor("downloaded_png") }
        }

        await notifyError(textFor("download_error"))
        return { status: "failed", message: textFor("download_error") }
    }

    const downloadSvg = async (): Promise<ToolActionResult> => {
        if (!text.trim()) {
            return { status: "failed", message: textFor("download_error") }
        }

        try {
            const finalSvg = await buildQrSvg({
                text,
                size,
                margin,
                errorCorrectionLevel,
                fgColor,
                bgColor,
                logoDataUrl,
                logoEnabled,
                logoScale,
            })
            const result = downloadSvgFile(finalSvg, "qr-code.svg")
            if (result.ok) {
                await notifySuccess(textFor("downloaded_svg"))
                return { status: "success", message: textFor("downloaded_svg") }
            }

            await notifyError(textFor("download_error"))
            return { status: "failed", message: textFor("download_error") }
        } catch {
            await notifyError(textFor("download_error"))
            return { status: "failed", message: textFor("download_error") }
        }
    }

    const handleCopyDataUrl = async () => {
        if (!dataUrl) return
        const result = await safeClipboardWrite(dataUrl)
        if (!result.ok) {
            await notifyError(t.common.copy_failed)
            return
        }
        await notifySuccess(t.common.copied, textFor("copied_data_url"))
    }

    const handleReset = () => {
        applyPreset(PRESETS[0])
        setLogoEnabled(false)
        setLogoDataUrl(null)
        setLogoName("")
        void notifySuccess(textFor("reset_done"))
    }

    const handleClearText = () => {
        setText("")
    }

    const handleSample = () => {
        setText(SAMPLE_QR_TEXT)
        applyPreset(PRESETS[2])
    }

    const clearDecode = () => {
        decodeRequestRef.current += 1
        setDecodeStatus("idle")
        setDecodedPayload("")
        setDecodeError("")
        setDecodeFileName("")
        if (decodeInputRef.current) decodeInputRef.current.value = ""
    }

    const handleDecodeFile = async (file: File | null) => {
        if (!file) return
        const requestId = ++decodeRequestRef.current
        setDecodeStatus("decoding")
        setDecodedPayload("")
        setDecodeError("")
        setDecodeFileName(file.name)

        const result = await decodeQrImageFile(file)
        if (requestId !== decodeRequestRef.current) return
        if (!result.ok) {
            const message = textFor(DECODE_ERROR_KEYS[result.error])
            setDecodeStatus("error")
            setDecodeError(message)
            await notifyError(message)
            return
        }

        setDecodedPayload(result.payload)
        setDecodeStatus("success")
    }

    const handleCopyDecoded = async (): Promise<ToolActionResult> => {
        if (!decodedPayload) return { status: "failed", message: t.common.copy_failed }
        const result = await safeClipboardWrite(decodedPayload)
        if (!result.ok) {
            await notifyError(t.common.copy_failed)
            return { status: "failed", message: t.common.copy_failed }
        }
        await notifySuccess(t.common.copied, textFor("decode_copy_success"))
        return { status: "success", message: textFor("decode_copy_success") }
    }

    const generateActions: ToolAction[] = [
        {
            id: "sample",
            label: t.common.sample,
            icon: TestTube2,
            onClick: handleSample,
        },
        {
            id: "png",
            label: "PNG",
            icon: Download,
            onClick: downloadPng,
            disabled: !dataUrl,
        },
        {
            id: "svg",
            label: "SVG",
            icon: Download,
            onClick: downloadSvg,
            disabled: !text.trim(),
        },
        {
            id: "copy",
            label: t.common.copy,
            icon: Copy,
            onClick: handleCopyDataUrl,
            disabled: !dataUrl,
        },
        {
            id: "reset",
            label: t.common.reset,
            icon: RotateCcw,
            onClick: handleReset,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Trash2,
            onClick: handleClearText,
        },
    ]

    const decodeActions: ToolAction[] = [
        {
            id: "upload",
            label: textFor("decode_upload"),
            icon: Upload,
            onClick: () => decodeInputRef.current?.click(),
        },
        {
            id: "copy",
            label: t.common.copy,
            icon: Copy,
            onClick: handleCopyDecoded,
            disabled: !decodedPayload,
        },
        {
            id: "open",
            label: t.common.open,
            icon: ExternalLink,
            href: decodedUrl?.toString() || "#",
            disabled: !decodedUrl,
            disabledReason: decodedPayload && !decodedUrl ? textFor("decode_not_url") : undefined,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Trash2,
            onClick: clearDecode,
            disabled: decodeStatus === "idle" && !decodeFileName,
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <QrCode className="h-6 w-6 text-primary" />
                        {textFor("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {textFor("description")}
                    </p>
                </div>
                <div
                    role="tablist"
                    aria-label={textFor("mode_label")}
                    className="inline-grid w-full grid-cols-2 rounded-md border bg-muted/40 p-1 sm:w-fit"
                >
                    <button
                        type="button"
                        role="tab"
                        id="qr-generate-tab"
                        aria-controls="qr-generate-panel"
                        aria-selected={mode === "generate"}
                        onClick={() => setMode("generate")}
                        className={joinClasses(
                            "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:min-h-9",
                            mode === "generate" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <QrCode className="h-4 w-4" />
                        {textFor("mode_generate")}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        id="qr-decode-tab"
                        aria-controls="qr-decode-panel"
                        aria-selected={mode === "decode"}
                        onClick={() => setMode("decode")}
                        className={joinClasses(
                            "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:min-h-9",
                            mode === "decode" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <ScanLine className="h-4 w-4" />
                        {textFor("mode_decode")}
                    </button>
                </div>
                <ToolActionBar actions={mode === "generate" ? generateActions : decodeActions} />
            </div>

            {mode === "generate" ? (
                <div
                    id="qr-generate-panel"
                    role="tabpanel"
                    aria-labelledby="qr-generate-tab"
                    className="grid grid-cols-1 gap-6 md:grid-cols-12"
                >
                <div className="md:col-span-4 lg:col-span-4">
                    <div className="space-y-5 rounded-lg border bg-card p-5 shadow-sm">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{textFor("content")}</label>
                            <textarea
                                value={text}
                                onChange={(event) => setText(event.target.value)}
                                className="h-24 w-full resize-none rounded-md border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder={textFor("placeholder")}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {textFor("presets")}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {PRESETS.map((preset) => (
                                    <InlineButton
                                        key={preset.id}
                                        type="button"
                                        variant={activePreset === preset.id ? "default" : "outline"}
                                        onClick={() => applyPreset(preset)}
                                    >
                                        {textFor(preset.labelKey)}
                                    </InlineButton>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{textFor("size")} {size}px</label>
                            <Slider value={[size]} onValueChange={([v]) => setSize(v)} min={128} max={640} step={32} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{textFor("margin")} {margin}</label>
                            <Slider value={[margin]} onValueChange={([v]) => setMargin(v)} min={0} max={8} step={1} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{textFor("ecc")}</label>
                            <Select value={errorCorrectionLevel} onValueChange={(value) => setErrorCorrectionLevel(value as ErrorCorrectionLevel)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="L">{textFor("ecc_l")}</SelectItem>
                                    <SelectItem value="M">{textFor("ecc_m")}</SelectItem>
                                    <SelectItem value="Q">{textFor("ecc_q")}</SelectItem>
                                    <SelectItem value="H">{textFor("ecc_h")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">{textFor("fg")}</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={fgColor}
                                        onChange={(event) => setFgColor(event.target.value)}
                                        className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                                    />
                                    <Input value={fgColor} onChange={(event) => setFgColor(event.target.value)} className="h-9 text-xs font-mono" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">{textFor("bg")}</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={bgColor}
                                        onChange={(event) => setBgColor(event.target.value)}
                                        className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                                    />
                                    <Input value={bgColor} onChange={(event) => setBgColor(event.target.value)} className="h-9 text-xs font-mono" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">{textFor("logo_toggle")}</label>
                                <Switch checked={logoEnabled} onCheckedChange={setLogoEnabled} />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <InlineButton type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                                    <ImagePlus className="mr-1 h-4 w-4" />
                                    {textFor("logo_upload")}
                                </InlineButton>
                                <InlineButton type="button" variant="outline" onClick={handleRemoveLogo} disabled={!logoDataUrl}>
                                    {textFor("logo_remove")}
                                </InlineButton>
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    className="hidden"
                                    accept={LOGO_FILE_POLICY.accept}
                                    onChange={(event) => {
                                        const file = event.currentTarget.files?.[0] || null
                                        event.currentTarget.value = ""
                                        void handleLogoUpload(file)
                                    }}
                                />
                            </div>

                            {logoName ? (
                                <p className="text-xs text-muted-foreground">{logoName}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">{textFor("logo_hint")}</p>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">{textFor("logo_size")} {logoScale}%</label>
                                <Slider value={[logoScale]} onValueChange={([v]) => setLogoScale(v)} min={12} max={34} step={1} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-8 lg:col-span-8">
                    <ToolPreviewArea
                        title={textFor("preview_label") || "Preview"}
                        metadata={`${size} × ${size} px`}
                        className="h-full min-h-[540px]"
                    >
                        {text.trim() ? (
                            <canvas ref={canvasRef} className="rounded-xl shadow-2xl transition-transform duration-300 hover:scale-[1.02]" />
                        ) : (
                            <p className="text-sm text-muted-foreground">{textFor("prompt")}</p>
                        )}
                    </ToolPreviewArea>
                </div>
                </div>
            ) : (
                <section
                    id="qr-decode-panel"
                    role="tabpanel"
                    aria-labelledby="qr-decode-tab"
                    className="grid grid-cols-1 gap-6 md:grid-cols-12"
                >
                    <div className="space-y-4 md:col-span-5">
                        <label
                            className={joinClasses(
                                "flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed bg-card p-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring/50",
                                decodeDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/60",
                            )}
                            onDragEnter={(event) => {
                                event.preventDefault()
                                setDecodeDragActive(true)
                            }}
                            onDragOver={(event) => {
                                event.preventDefault()
                                event.dataTransfer.dropEffect = "copy"
                            }}
                            onDragLeave={() => setDecodeDragActive(false)}
                            onDrop={(event) => {
                                event.preventDefault()
                                setDecodeDragActive(false)
                                void handleDecodeFile(event.dataTransfer.files?.[0] || null)
                            }}
                        >
                            <input
                                ref={decodeInputRef}
                                type="file"
                                className="sr-only"
                                accept={QR_DECODE_FILE_POLICY.accept}
                                onChange={(event) => {
                                    const file = event.currentTarget.files?.[0] || null
                                    event.currentTarget.value = ""
                                    void handleDecodeFile(file)
                                }}
                            />
                            {decodeStatus === "decoding" ? (
                                <LoaderCircle className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
                            ) : (
                                <FileImage className="h-10 w-10 text-primary" aria-hidden="true" />
                            )}
                            <span className="text-base font-semibold text-foreground">
                                {decodeStatus === "decoding" ? textFor("decode_processing") : textFor("decode_drop")}
                            </span>
                            <span className="text-sm text-muted-foreground">{textFor("decode_formats")}</span>
                            {decodeFileName ? (
                                <span className="max-w-full truncate text-xs text-muted-foreground">{decodeFileName}</span>
                            ) : null}
                        </label>

                        <p className="text-sm text-muted-foreground">{textFor("decode_one_code")}</p>
                        {decodeStatus === "error" ? (
                            <div
                                role="alert"
                                data-testid="qr-decode-error"
                                className="rounded-md border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive"
                            >
                                {decodeError}
                            </div>
                        ) : null}
                    </div>

                    <div className="md:col-span-7">
                        <ToolPreviewArea
                            title={textFor("decode_result")}
                            metadata={decodedPayload ? (decodedUrl ? textFor("decode_type_url") : textFor("decode_type_text")) : undefined}
                            className="h-full min-h-[420px]"
                        >
                            {decodedPayload ? (
                                <div className="flex h-full w-full flex-col gap-3 text-left">
                                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                                        {decodedUrl ? textFor("decode_type_url") : textFor("decode_type_text")}
                                    </div>
                                    <pre
                                        data-testid="qr-decoded-output"
                                        className="max-h-[360px] min-h-[180px] w-full overflow-auto whitespace-pre-wrap break-all rounded-md border bg-background p-4 font-mono text-sm text-foreground"
                                    >
                                        {decodedPayload}
                                    </pre>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    {decodeStatus === "decoding" ? textFor("decode_processing") : textFor("decode_prompt")}
                                </p>
                            )}
                        </ToolPreviewArea>
                    </div>
                </section>
            )}

            <RelatedTools toolKey="qr_code_generator" />
        </div>
    )
}
