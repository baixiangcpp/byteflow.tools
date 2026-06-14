"use client"

import { ChannelField, ModeButton, FormatBox } from "./components"
import * as React from "react"
import { AlertCircle, Copy, Eraser, Palette } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLang } from "@/core/i18n/lang-provider"
import Color from "color"
import { clampAlpha, clampRgbChannel, formatRgba, parseHexToRgb, rgbToHex, rgbaToHex8 } from "@/core/utils/color-utils"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

type ConverterMode = "all" | "hex_to_rgba" | "rgba_to_hex"
type ParsedColor = ReturnType<typeof Color>

export type ColorConverterClientProps = {
    initialMode?: ConverterMode
    availableModes?: ConverterMode[]
}

export function ColorConverterPage({
    initialMode = "all",
    availableModes = ["all", "hex_to_rgba", "rgba_to_hex"],
}: ColorConverterClientProps) {
    const { t } = useLang()
    const toolT = t.tools["color_converter"] as Record<string, string>

    const [mode, setMode] = React.useState<ConverterMode>(initialMode)
    const [input, setInput] = React.useState("#3b82f6")
    const [colorObj, setColorObj] = React.useState<ParsedColor | null>(null)
    const [error, setError] = React.useState<string | null>(null)

    const [quickHex, setQuickHex] = React.useState("#3b82f6")
    const [quickAlpha, setQuickAlpha] = React.useState(1)
    const [rgbaRed, setRgbaRed] = React.useState(255)
    const [rgbaGreen, setRgbaGreen] = React.useState(0)
    const [rgbaBlue, setRgbaBlue] = React.useState(0)
    const [rgbaAlpha, setRgbaAlpha] = React.useState(0.5)
    const canSwitchMode = availableModes.length > 1

    React.useEffect(() => {
        if (!availableModes.includes(mode)) {
            setMode(availableModes[0] ?? "all")
        }
    }, [availableModes, mode])

    React.useEffect(() => {
        if (!input.trim()) {
            setColorObj(null)
            setError(null)
            return
        }

        try {
            const parsedColor = Color(input)
            setColorObj(parsedColor)
            setError(null)
        } catch {
            setColorObj(null)
            setError(toolT.invalid_color)
        }
    }, [input, toolT.invalid_color])

    const handleCopy = async (text: string, label: string) => {
        if (!text) return
        const result = await safeClipboardWrite(text)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: `${label} ${(toolT.copied_suffix)}`,
        })
    }

    const hexValue = colorObj ? colorObj.hex() : ""
    const rgbValue = colorObj ? colorObj.rgb().round().string() : ""
    const hslValue = colorObj ? colorObj.hsl().round().string() : ""
    const cmykValue = colorObj ? `cmyk(${colorObj.cmyk().round().array().join(", ")})` : ""

    const quickRgb = React.useMemo(() => parseHexToRgb(quickHex), [quickHex])
    const quickRgba = React.useMemo(
        () => (quickRgb ? formatRgba(quickRgb, quickAlpha) : ""),
        [quickAlpha, quickRgb],
    )
    const rgbaQuickRgb = React.useMemo(
        () => ({
            r: clampRgbChannel(rgbaRed),
            g: clampRgbChannel(rgbaGreen),
            b: clampRgbChannel(rgbaBlue),
        }),
        [rgbaBlue, rgbaGreen, rgbaRed],
    )
    const rgbaPreview = React.useMemo(
        () => formatRgba(rgbaQuickRgb, rgbaAlpha),
        [rgbaAlpha, rgbaQuickRgb],
    )
    const hex6FromRgba = React.useMemo(
        () => rgbToHex(rgbaQuickRgb),
        [rgbaQuickRgb],
    )
    const hex8FromRgba = React.useMemo(
        () => rgbaToHex8(rgbaQuickRgb, rgbaAlpha),
        [rgbaAlpha, rgbaQuickRgb],
    )

    const updateRgbChannel = (setter: (value: number) => void, value: string) => {
        const parsed = Number.parseInt(value, 10)
        if (Number.isNaN(parsed)) {
            setter(0)
            return
        }
        setter(clampRgbChannel(parsed))
    }

    const resetAll = () => {
        setMode(initialMode)
        setInput("#3b82f6")
        setQuickHex("#3b82f6")
        setQuickAlpha(1)
        setRgbaRed(255)
        setRgbaGreen(0)
        setRgbaBlue(0)
        setRgbaAlpha(0.5)
        setError(null)
    }

    const actions: ToolAction[] = [
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: resetAll,
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Palette className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            {canSwitchMode ? (
                <div className="rounded-lg border bg-card p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {toolT.mode_label}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {availableModes.includes("all") ? (
                            <ModeButton
                                active={mode === "all"}
                                onClick={() => setMode("all")}
                                label={toolT.mode_all}
                            />
                        ) : null}
                        {availableModes.includes("hex_to_rgba") ? (
                            <ModeButton
                                active={mode === "hex_to_rgba"}
                                onClick={() => setMode("hex_to_rgba")}
                                label={toolT.mode_hex_to_rgba}
                            />
                        ) : null}
                        {availableModes.includes("rgba_to_hex") ? (
                            <ModeButton
                                active={mode === "rgba_to_hex"}
                                onClick={() => setMode("rgba_to_hex")}
                                label={toolT.mode_rgba_to_hex}
                            />
                        ) : null}
                    </div>
                </div>
            ) : null}

            {mode === "all" ? (
                <div className="grid grid-cols-1 gap-8 pt-2 md:grid-cols-2">
                    <div className="flex flex-col space-y-6">
                        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    {toolT.input_label}
                                </label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        className={`h-12 pr-10 font-mono text-lg ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                        placeholder="#3b82f6"
                                        value={input}
                                        onChange={(event) => setInput(event.target.value)}
                                        spellCheck={false}
                                    />
                                    {error ? (
                                        <AlertCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive" />
                                    ) : null}
                                </div>
                                {error ? (
                                    <p className="mt-1.5 text-sm font-medium text-destructive">{error}</p>
                                ) : null}
                            </div>

                            <div className="space-y-2 pt-4">
                                <label className="text-sm font-medium uppercase leading-none tracking-wider text-muted-foreground">
                                    {toolT.preview_label}
                                </label>
                                <div
                                    className="h-48 w-full rounded-lg border shadow-inner transition-colors duration-200"
                                    style={{ backgroundColor: colorObj ? colorObj.string() : "transparent" }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-4">
                        <h3 className="text-lg font-semibold">{toolT.conversions}</h3>
                        <div className="space-y-4">
                            <FormatBox
                                label="HEX"
                                value={hexValue}
                                onCopy={() => void handleCopy(hexValue, "HEX")}
                                disabled={!colorObj}
                                waiting={toolT.waiting}
                                copyLabel={`${t.common.copy} HEX`}
                            />
                            <FormatBox
                                label="RGB"
                                value={rgbValue}
                                onCopy={() => void handleCopy(rgbValue, "RGB")}
                                disabled={!colorObj}
                                waiting={toolT.waiting}
                                copyLabel={`${t.common.copy} RGB`}
                            />
                            <FormatBox
                                label="HSL"
                                value={hslValue}
                                onCopy={() => void handleCopy(hslValue, "HSL")}
                                disabled={!colorObj}
                                waiting={toolT.waiting}
                                copyLabel={`${t.common.copy} HSL`}
                            />
                            <FormatBox
                                label="CMYK"
                                value={cmykValue}
                                onCopy={() => void handleCopy(cmykValue, "CMYK")}
                                disabled={!colorObj}
                                waiting={toolT.waiting}
                                copyLabel={`${t.common.copy} CMYK`}
                            />
                        </div>
                    </div>
                </div>
            ) : mode === "hex_to_rgba" ? (
                <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
                    <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{toolT.hex_input}</label>
                            <Input
                                type="text"
                                className={`font-mono text-base ${!quickRgb && quickHex.trim() ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                placeholder="#3b82f6"
                                value={quickHex}
                                onChange={(event) => setQuickHex(event.target.value)}
                                spellCheck={false}
                            />
                            {!quickRgb && quickHex.trim() ? (
                                <p className="text-xs font-medium text-destructive">{toolT.invalid_hex}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {toolT.alpha_label.replace("{value}", String(clampAlpha(quickAlpha)))}
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={quickAlpha}
                                onChange={(event) => setQuickAlpha(clampAlpha(Number(event.target.value)))}
                                className="w-full"
                            />
                        </div>

                        <div
                            className="h-28 rounded-lg border"
                            style={{ backgroundColor: quickRgb ? quickRgba : "transparent" }}
                        />
                    </div>

                    <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                        <label className="text-sm font-medium text-foreground">
                            {toolT.rgba_output}
                        </label>
                        <div className="rounded-md border bg-muted/20 p-4 font-mono text-base text-foreground">
                            {quickRgb ? quickRgba : toolT.waiting}
                        </div>
                        <Button onClick={() => void handleCopy(quickRgba, "RGBA")} disabled={!quickRgb}>
                            <Copy className="mr-2 h-4 w-4" />
                            {toolT.copy_rgba}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
                    <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                        <div className="grid grid-cols-3 gap-3">
                            <ChannelField
                                label={toolT.red}
                                value={rgbaRed}
                                onChange={(value) => updateRgbChannel(setRgbaRed, value)}
                            />
                            <ChannelField
                                label={toolT.green}
                                value={rgbaGreen}
                                onChange={(value) => updateRgbChannel(setRgbaGreen, value)}
                            />
                            <ChannelField
                                label={toolT.blue}
                                value={rgbaBlue}
                                onChange={(value) => updateRgbChannel(setRgbaBlue, value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {toolT.alpha_label.replace("{value}", String(clampAlpha(rgbaAlpha)))}
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={rgbaAlpha}
                                onChange={(event) => setRgbaAlpha(clampAlpha(Number(event.target.value)))}
                                className="w-full"
                            />
                        </div>

                        <div className="rounded-md border bg-muted/20 p-3 font-mono text-sm text-foreground">
                            {rgbaPreview}
                        </div>

                        <div
                            className="h-28 rounded-lg border"
                            style={{ backgroundColor: rgbaPreview }}
                        />
                    </div>

                    <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                        <FormatBox
                            label={toolT.hex8_output}
                            value={hex8FromRgba}
                            onCopy={() => void handleCopy(hex8FromRgba, "HEX8")}
                            disabled={false}
                            waiting={toolT.waiting}
                            copyLabel={`${t.common.copy} ${toolT.hex8_output}`}
                        />
                        <FormatBox
                            label={toolT.hex6_output}
                            value={hex6FromRgba}
                            onCopy={() => void handleCopy(hex6FromRgba, "HEX")}
                            disabled={false}
                            waiting={toolT.waiting}
                            copyLabel={`${t.common.copy} ${toolT.hex6_output}`}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
