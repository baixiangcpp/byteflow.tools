import * as React from "react"
import { FileImage, ImagePlus, LoaderCircle, QrCode, ScanLine } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { FILE_INPUT_POLICIES } from "@/core/files/file-input-policy"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import { BUTTON_BASE_CLASS, BUTTON_SIZE_CLASS, BUTTON_VARIANT_CLASS, PRESETS } from "./constants"
import type { ErrorCorrectionLevel, QrPreset } from "./types"

export type QrMode = "generate" | "decode"
export type DecodeStatus = "idle" | "decoding" | "success" | "error"

type TextFor = (key: string) => string

function joinClasses(...values: Array<string | null | undefined | false>) {
    return values.filter(Boolean).join(" ")
}

type InlineButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof BUTTON_VARIANT_CLASS
}

function InlineButton({ className, type = "button", variant = "outline", ...props }: InlineButtonProps) {
    return (
        <button
            type={type}
            className={joinClasses(BUTTON_BASE_CLASS, BUTTON_VARIANT_CLASS[variant], BUTTON_SIZE_CLASS.sm, className)}
            {...props}
        />
    )
}

export function QrModeTabs({ mode, onChange, textFor }: { mode: QrMode; onChange: (mode: QrMode) => void; textFor: TextFor }) {
    return (
        <div role="tablist" aria-label={textFor("mode_label")} className="inline-grid w-full grid-cols-2 rounded-md border bg-muted/40 p-1 sm:w-fit">
            <button
                type="button"
                role="tab"
                id="qr-generate-tab"
                aria-controls="qr-generate-panel"
                aria-selected={mode === "generate"}
                onClick={() => onChange("generate")}
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
                onClick={() => onChange("decode")}
                className={joinClasses(
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:min-h-9",
                    mode === "decode" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
            >
                <ScanLine className="h-4 w-4" />
                {textFor("mode_decode")}
            </button>
        </div>
    )
}

type QrGeneratePanelProps = {
    activePreset: string
    applyPreset: (preset: QrPreset) => void
    bgColor: string
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    errorCorrectionLevel: ErrorCorrectionLevel
    fgColor: string
    handleLogoUpload: (file: File | null) => void | Promise<void>
    handleRemoveLogo: () => void
    logoDataUrl: string | null
    logoEnabled: boolean
    logoInputRef: React.RefObject<HTMLInputElement | null>
    logoName: string
    logoScale: number
    margin: number
    setBgColor: (value: string) => void
    setErrorCorrectionLevel: (value: ErrorCorrectionLevel) => void
    setFgColor: (value: string) => void
    setLogoEnabled: (value: boolean) => void
    setLogoScale: (value: number) => void
    setMargin: (value: number) => void
    setSize: (value: number) => void
    setText: (value: string) => void
    size: number
    text: string
    textFor: TextFor
}

export function QrGeneratePanel({
    activePreset,
    applyPreset,
    bgColor,
    canvasRef,
    errorCorrectionLevel,
    fgColor,
    handleLogoUpload,
    handleRemoveLogo,
    logoDataUrl,
    logoEnabled,
    logoInputRef,
    logoName,
    logoScale,
    margin,
    setBgColor,
    setErrorCorrectionLevel,
    setFgColor,
    setLogoEnabled,
    setLogoScale,
    setMargin,
    setSize,
    setText,
    size,
    text,
    textFor,
}: QrGeneratePanelProps) {
    return (
        <div id="qr-generate-panel" role="tabpanel" aria-labelledby="qr-generate-tab" className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="md:col-span-4 lg:col-span-4">
                <div className="space-y-5 rounded-lg border bg-card p-5 shadow-sm">
                    <div className="space-y-2">
                        <label htmlFor="qr-content" className="text-sm font-medium">{textFor("content")}</label>
                        <Textarea
                            id="qr-content"
                            intent="shortText"
                            value={text}
                            onChange={(event) => setText(event.target.value)}
                            className="bg-background font-mono text-sm"
                            placeholder={textFor("placeholder")}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{textFor("presets")}</label>
                        <div className="flex flex-wrap gap-2">
                            {PRESETS.map((preset) => (
                                <InlineButton key={preset.id} variant={activePreset === preset.id ? "default" : "outline"} onClick={() => applyPreset(preset)}>
                                    {textFor(preset.labelKey)}
                                </InlineButton>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{textFor("size")} {size}px</label>
                        <Slider value={[size]} onValueChange={([value]) => setSize(value)} min={128} max={640} step={32} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{textFor("margin")} {margin}</label>
                        <Slider value={[margin]} onValueChange={([value]) => setMargin(value)} min={0} max={8} step={1} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{textFor("ecc")}</label>
                        <Select value={errorCorrectionLevel} onValueChange={(value) => setErrorCorrectionLevel(value as ErrorCorrectionLevel)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="L">{textFor("ecc_l")}</SelectItem>
                                <SelectItem value="M">{textFor("ecc_m")}</SelectItem>
                                <SelectItem value="Q">{textFor("ecc_q")}</SelectItem>
                                <SelectItem value="H">{textFor("ecc_h")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                        <ColorControl label={textFor("fg")} value={fgColor} onChange={setFgColor} />
                        <ColorControl label={textFor("bg")} value={bgColor} onChange={setBgColor} />
                    </div>

                    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                        <div className="flex items-center justify-between">
                            <label htmlFor="qr-logo-toggle" className="text-sm font-medium">{textFor("logo_toggle")}</label>
                            <Switch id="qr-logo-toggle" checked={logoEnabled} onCheckedChange={setLogoEnabled} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <InlineButton variant="outline" onClick={() => logoInputRef.current?.click()}>
                                <ImagePlus className="mr-1 h-4 w-4" />
                                {textFor("logo_upload")}
                            </InlineButton>
                            <InlineButton variant="outline" onClick={handleRemoveLogo} disabled={!logoDataUrl}>{textFor("logo_remove")}</InlineButton>
                            <input
                                ref={logoInputRef}
                                type="file"
                                data-input-intent="payload"
                                className="hidden"
                                accept={FILE_INPUT_POLICIES["image-logo"].accept}
                                onChange={(event) => {
                                    const file = event.currentTarget.files?.[0] || null
                                    event.currentTarget.value = ""
                                    void handleLogoUpload(file)
                                }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{logoName || textFor("logo_hint")}</p>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{textFor("logo_size")} {logoScale}%</label>
                            <Slider value={[logoScale]} onValueChange={([value]) => setLogoScale(value)} min={12} max={34} step={1} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:col-span-8 lg:col-span-8">
                <ToolPreviewArea title={textFor("preview_label") || "Preview"} metadata={`${size} x ${size} px`} className="h-full min-h-[540px]">
                    {text.trim() ? (
                        <canvas ref={canvasRef} className="rounded-xl shadow-2xl transition-transform duration-300 hover:scale-[1.02]" />
                    ) : (
                        <p className="text-sm text-muted-foreground">{textFor("prompt")}</p>
                    )}
                </ToolPreviewArea>
            </div>
        </div>
    )
}

function ColorControl({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    aria-label={`${label} swatch`}
                    data-input-intent="scalar"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="size-11 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0 lg:size-9"
                />
                <Input
                    aria-label={label}
                    intent="scalar"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="text-xs font-mono"
                />
            </div>
        </div>
    )
}

type QrDecodePanelProps = {
    decodeDragActive: boolean
    decodeError: string
    decodeFileName: string
    decodeInputRef: React.RefObject<HTMLInputElement | null>
    decodedPayload: string
    decodedUrl: URL | null
    decodeStatus: DecodeStatus
    handleDecodeFile: (file: File | null) => void | Promise<void>
    setDecodeDragActive: (value: boolean) => void
    textFor: TextFor
}

export function QrDecodePanel({
    decodeDragActive,
    decodeError,
    decodeFileName,
    decodeInputRef,
    decodedPayload,
    decodedUrl,
    decodeStatus,
    handleDecodeFile,
    setDecodeDragActive,
    textFor,
}: QrDecodePanelProps) {
    return (
        <section id="qr-decode-panel" role="tabpanel" aria-labelledby="qr-decode-tab" className="grid grid-cols-1 gap-6 md:grid-cols-12">
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
                        data-input-intent="payload"
                        className="sr-only"
                        accept={FILE_INPUT_POLICIES["qr-decode-image"].accept}
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
                    {decodeFileName ? <span className="max-w-full truncate text-xs text-muted-foreground">{decodeFileName}</span> : null}
                </label>

                <p className="text-sm text-muted-foreground">{textFor("decode_one_code")}</p>
                {decodeStatus === "error" ? (
                    <div role="alert" data-testid="qr-decode-error" className="rounded-md border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive">
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
                                data-input-intent="generatedOutput"
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
    )
}
