"use client"

import * as React from "react"
import { Copy, Download, ExternalLink, QrCode, RotateCcw, TestTube2, Trash2, Upload } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { ToolActionBar, type ToolAction, type ToolActionResult } from "@/features/tool-shell/tool-action-bar"
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
import { DEFAULT_QR_TEXT, PRESETS, SAMPLE_QR_TEXT } from "./constants"
import { QrDecodePanel, QrGeneratePanel, QrModeTabs, type DecodeStatus, type QrMode } from "./panels"
import type { ErrorCorrectionLevel, QrPreset } from "./types"
import { ToolPageContainer } from "@/components/layout/page-container"
const LOGO_FILE_POLICY = FILE_INPUT_POLICIES["image-logo"]

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
        <ToolPageContainer className="flex h-full flex-col space-y-6">
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
                <QrModeTabs mode={mode} onChange={setMode} textFor={textFor} />
                <ToolActionBar actions={mode === "generate" ? generateActions : decodeActions} />
            </div>

            {mode === "generate" ? (
                <QrGeneratePanel
                    activePreset={activePreset}
                    applyPreset={applyPreset}
                    bgColor={bgColor}
                    canvasRef={canvasRef}
                    errorCorrectionLevel={errorCorrectionLevel}
                    fgColor={fgColor}
                    handleLogoUpload={handleLogoUpload}
                    handleRemoveLogo={handleRemoveLogo}
                    logoDataUrl={logoDataUrl}
                    logoEnabled={logoEnabled}
                    logoInputRef={logoInputRef}
                    logoName={logoName}
                    logoScale={logoScale}
                    margin={margin}
                    setBgColor={setBgColor}
                    setErrorCorrectionLevel={setErrorCorrectionLevel}
                    setFgColor={setFgColor}
                    setLogoEnabled={setLogoEnabled}
                    setLogoScale={setLogoScale}
                    setMargin={setMargin}
                    setSize={setSize}
                    setText={setText}
                    size={size}
                    text={text}
                    textFor={textFor}
                />
            ) : (
                <QrDecodePanel
                    decodeDragActive={decodeDragActive}
                    decodeError={decodeError}
                    decodeFileName={decodeFileName}
                    decodeInputRef={decodeInputRef}
                    decodedPayload={decodedPayload}
                    decodedUrl={decodedUrl}
                    decodeStatus={decodeStatus}
                    handleDecodeFile={handleDecodeFile}
                    setDecodeDragActive={setDecodeDragActive}
                    textFor={textFor}
                />
            )}

            <RelatedTools toolKey="qr_code_generator" />
        </ToolPageContainer>
    )
}
