"use client"

import * as React from "react"
import * as beautify from "js-beautify"
import { Play, Copy, Eraser, FileCode2, AlignLeft, Download, SlidersHorizontal, ArrowRightLeft, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { Switch } from "@/components/ui/switch"
import { DEFAULT_CSS_FORMAT_OPTIONS, formatCssWithOptions, type CssFormatOptions } from "@/core/utils/css-formatter-utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { buildFormatterDownloadConfig, type FormatterAction, type FormatterMode } from "@/core/files/formatter-download-utils"
import { getByteflowMonacoThemeName, ensureByteflowMonacoThemes } from "@/core/utils/monaco-theme"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { readStorageJson, readStorageString, removeStorageKey, writeStorageJson, writeStorageString } from "@/core/storage/tool-persistence"
import { buildToolHandoffLink, getToolHandoffFromSearchParams } from "@/core/routing/tool-handoff"
import { importTextFile, TEXT_FILE_IMPORT_ACCEPT } from "@/core/files/text-file-import"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

type HtmlCssBeautifierToolProps = {
    toolKey?: "html_css_beautifier" | "html_formatter"
    initialMode?: FormatterMode
    availableModes?: FormatterMode[]
}

const INPUT_STORAGE_DEBOUNCE_MS = 500
const INPUT_STORAGE_MAX_CHARS = 2_000_000

function isCssFormatOptions(value: unknown): value is CssFormatOptions {
    if (!value || typeof value !== "object") return false
    const candidate = value as Record<string, unknown>
    return typeof candidate.indentSize === "number"
        && typeof candidate.selectorSeparatorNewline === "boolean"
        && typeof candidate.newlineBetweenRules === "boolean"
        && typeof candidate.spaceAroundCombinator === "boolean"
        && typeof candidate.endWithNewline === "boolean"
}

export function HtmlCssBeautifierTool({
    toolKey = "html_css_beautifier",
    initialMode = "html",
    availableModes = ["html", "css"],
}: HtmlCssBeautifierToolProps) {
    const { t, lang } = useLang()
    const toolT = t.tools[toolKey] as Record<string, string>
    const sharedToolT = t.tools?.["html_css_beautifier"] as Record<string, string>

    const text = (key: string) => toolT[key] ?? sharedToolT[key]

    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [mode, setMode] = React.useState<FormatterMode>(initialMode)
    const [error, setError] = React.useState<string | null>(null)
    const [importError, setImportError] = React.useState<string | null>(null)
    const [lastAction, setLastAction] = React.useState<FormatterAction>(null)
    const [cssOptions, setCssOptions] = React.useState<CssFormatOptions>(DEFAULT_CSS_FORMAT_OPTIONS)
    const storagePrefix = React.useMemo(() => `byteflow:${toolKey}`, [toolKey])
    const appliedHandoffRef = React.useRef<string | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const canSwitchMode = availableModes.length > 1
    const { resolvedTheme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)

    React.useEffect(() => {
        if (!availableModes.includes(mode)) {
            setMode(availableModes[0] || "html")
        }
    }, [availableModes, mode])

    React.useEffect(() => {
        const savedInput = readStorageString(`${storagePrefix}:input`)
        if (savedInput !== null) {
            setInput(savedInput)
        }

        const savedMode = readStorageString(`${storagePrefix}:mode`)
        if ((savedMode === "html" || savedMode === "css") && availableModes.includes(savedMode)) {
            setMode(savedMode)
        }

        const savedCssOptions = readStorageJson<unknown>(`${storagePrefix}:css-options`, DEFAULT_CSS_FORMAT_OPTIONS)
        if (isCssFormatOptions(savedCssOptions)) {
            setCssOptions(savedCssOptions)
        }
    }, [availableModes, storagePrefix])

    React.useEffect(() => {
        writeStorageString(`${storagePrefix}:mode`, mode)
    }, [mode, storagePrefix])

    React.useEffect(() => {
        writeStorageJson(`${storagePrefix}:css-options`, cssOptions)
    }, [cssOptions, storagePrefix])

    React.useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (!input.trim() || input.length > INPUT_STORAGE_MAX_CHARS) {
                removeStorageKey(`${storagePrefix}:input`)
                return
            }
            writeStorageString(`${storagePrefix}:input`, input)
        }, INPUT_STORAGE_DEBOUNCE_MS)

        return () => window.clearTimeout(timeoutId)
    }, [input, storagePrefix])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const handoff = getToolHandoffFromSearchParams(new URLSearchParams(window.location.search), window.location.hash)
        if (!handoff || handoff === appliedHandoffRef.current) return
        appliedHandoffRef.current = handoff
        setInput(handoff)
        setOutput("")
        setError(null)
        setImportError(null)
        setLastAction(null)
    }, [])

    const handoffPayload = output || input
    const htmlMinifierHandoff = React.useMemo(
        () => buildToolHandoffLink(lang, "html-minifier", handoffPayload),
        [handoffPayload, lang],
    )
    const htmlMinifierLabel = `${t.common.open} ${t.tools["html_minifier"].title}`

    const updateIndentSize = (value: string) => {
        const parsed = Number.parseInt(value, 10)
        if (Number.isNaN(parsed)) {
            setCssOptions((previous) => ({ ...previous, indentSize: 2 }))
            return
        }
        const clamped = Math.max(1, Math.min(8, parsed))
        setCssOptions((previous) => ({ ...previous, indentSize: clamped }))
    }

    const doFormat = () => {
        if (!input.trim()) {
            setOutput("")
            setError(null)
            setLastAction(null)
            return
        }

        try {
            let formatted = ""
            if (mode === "html") {
                formatted = beautify.html(input, { indent_size: 2, wrap_line_length: 80 })
            } else {
                formatted = formatCssWithOptions(input, cssOptions)
            }
            setOutput(formatted)
            setError(null)
            setLastAction("format")
        } catch {
            setError(
                mode === "html"
                    ? text("error_format_html")
                    : text("error_format_css"),
            )
        }
    }

    const doMinify = () => {
        if (!input.trim()) {
            setOutput("")
            setError(null)
            setLastAction(null)
            return
        }

        try {
            let minified = ""
            if (mode === "html") {
                minified = input
                    .replace(/<!--[\s\S]*?-->/g, "")
                    .replace(/\s+/g, " ")
                    .replace(/>\s+</g, "><")
                    .trim()
            } else {
                minified = input
                    .replace(/\/\*[\s\S]*?\*\//g, "")
                    .replace(/\s+/g, " ")
                    .replace(/\s*([{}:;,])\s*/g, "$1")
                    .trim()
            }
            setOutput(minified)
            setError(null)
            setLastAction("minify")
        } catch {
            setError(
                mode === "html"
                    ? text("error_minify_html")
                    : text("error_minify_css"),
            )
        }
    }

    const handleCopy = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: t.common.copied_desc,
        })
    }

    const handleDownload = () => {
        const downloadConfig = buildFormatterDownloadConfig({
            mode,
            lastAction,
            content: output,
        })
        if (!downloadConfig) return

        const blob = new Blob([downloadConfig.content], { type: downloadConfig.mimeType })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = downloadConfig.filename
        anchor.click()
        URL.revokeObjectURL(url)

        const message = mode === "html"
            ? text("download_html_success")
            : text("download_css_success")

        toast.success(t.common.success, {
            description: `${message} ${downloadConfig.filename}`,
        })
    }

    const openImportPicker = () => {
        fileInputRef.current?.click()
    }

    const handleImportFile = async (file: File) => {
        try {
            const content = await importTextFile(file)
            setInput(content)
            setOutput("")
            setError(null)
            setImportError(null)
            setLastAction(null)
        } catch (e: unknown) {
            setImportError(e instanceof Error ? e.message : text("import_failed"))
        }
    }

    const handleClear = () => {
        setInput("")
        setOutput("")
        setError(null)
        setImportError(null)
        setLastAction(null)
        removeStorageKey(`${storagePrefix}:input`)
    }

    const headerActions: ToolAction[] = [
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
        },
        {
            id: "import_file",
            label: text("import_file"),
            icon: Upload,
            onClick: openImportPicker,
        },
        {
            id: "minify",
            label: t.common.minify,
            icon: AlignLeft,
            onClick: doMinify,
        },
        {
            id: "download",
            label: mode === "html" ? text("download_html") : text("download_css"),
            icon: Download,
            onClick: handleDownload,
            disabled: !output,
        },
        ...(toolKey === "html_formatter" && mode === "html"
            ? [{
                id: "to_html_minifier",
                label: htmlMinifierLabel,
                icon: ArrowRightLeft,
                href: htmlMinifierHandoff.href,
                onClick: htmlMinifierHandoff.prime,
                disabled: !handoffPayload.trim(),
            } satisfies ToolAction]
            : []),
        {
            id: "format",
            label: mode === "css"
                ? text("format_css")
                : text("format_html"),
            icon: Play,
            onClick: doFormat,
            variant: "default",
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col space-y-8">
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
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <FileCode2 className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {text("description")}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {canSwitchMode ? (
                        <Select value={mode} onValueChange={(value) => setMode(value as FormatterMode)}>
                            <SelectTrigger className="h-9 w-[140px]">
                                <SelectValue placeholder={text("mode_label")} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableModes.includes("html") ? (
                                    <SelectItem value="html">{text("mode_html")}</SelectItem>
                                ) : null}
                                {availableModes.includes("css") ? (
                                    <SelectItem value="css">{text("mode_css")}</SelectItem>
                                ) : null}
                            </SelectContent>
                        </Select>
                    ) : null}
                    {mode === "css" ? (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                                    {text("options_button")}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-full sm:max-w-md">
                                <SheetHeader>
                                    <SheetTitle>{text("options_title")}</SheetTitle>
                                    <SheetDescription>
                                        {text("options_desc")}
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-4 px-4 pb-6">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            {text("indent_size")}
                                        </p>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={8}
                                            value={cssOptions.indentSize}
                                            onChange={(event) => updateIndentSize(event.target.value)}
                                        />
                                    </div>
                                    <OptionSwitch
                                        label={text("selector_separator_newline")}
                                        checked={cssOptions.selectorSeparatorNewline}
                                        onCheckedChange={(checked) => setCssOptions((previous) => ({ ...previous, selectorSeparatorNewline: checked }))}
                                    />
                                    <OptionSwitch
                                        label={text("newline_between_rules")}
                                        checked={cssOptions.newlineBetweenRules}
                                        onCheckedChange={(checked) => setCssOptions((previous) => ({ ...previous, newlineBetweenRules: checked }))}
                                    />
                                    <OptionSwitch
                                        label={text("space_around_combinator")}
                                        checked={cssOptions.spaceAroundCombinator}
                                        onCheckedChange={(checked) => setCssOptions((previous) => ({ ...previous, spaceAroundCombinator: checked }))}
                                    />
                                    <OptionSwitch
                                        label={text("end_with_newline")}
                                        checked={cssOptions.endWithNewline}
                                        onCheckedChange={(checked) => setCssOptions((previous) => ({ ...previous, endWithNewline: checked }))}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                    ) : null}
                    <ToolActionBar actions={headerActions} />
                </div>
            </div>

            {error ? (
                <div className="rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">
                    {error}
                </div>
            ) : null}
            {importError ? (
                <div className="rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">
                    {importError}
                </div>
            ) : null}

            <div className="grid min-h-[600px] flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.input}</span>
                    </div>
                    <div className="min-h-[300px] flex-1">
                        <MonacoEditor
                            key={`input-${mode}`}
                            height="100%"
                            language={mode}
                            theme={monacoTheme}
                            beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                            path={`byteflow-${mode}-input.${mode === "html" ? "html" : "css"}`}
                            value={input}
                            onChange={(value) => setInput(value || "")}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "var(--font-mono)",
                                lineHeight: 24,
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                                wordWrap: "on",
                            }}
                        />
                    </div>
                </div>

                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <Button variant="ghost" size="icon" onClick={() => void handleCopy()} disabled={!output}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">{t.common.copy_output}</span>
                        </Button>
                    </div>
                    <div className="min-h-[300px] flex-1">
                        <Textarea
                            className="h-full min-h-[300px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            value={output}
                            readOnly
                        />
                    </div>
                </div>
            </div>

            <RelatedTools toolKey={toolKey} />
        </div>
    )
}

function OptionSwitch({
    label,
    checked,
    onCheckedChange,
}: {
    label: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-md border bg-card p-3">
            <span className="text-sm text-foreground">{label}</span>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    )
}
