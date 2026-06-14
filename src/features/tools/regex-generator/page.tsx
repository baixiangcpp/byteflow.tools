"use client"

import * as React from "react"
import { Download, Eraser, Link2, Regex, TestTube2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useLang } from "@/core/i18n/lang-provider"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    buildRegexGeneratorResult,
    getRegexPresetSample,
    type RegexGeneratorPreset,
} from "@/features/tools/regex-generator/utils"

const PRESET_OPTIONS: Array<{ value: RegexGeneratorPreset; labelKey: string }> = [
    { value: "email", labelKey: "preset_email" },
    { value: "url", labelKey: "preset_url" },
    { value: "ipv4", labelKey: "preset_ipv4" },
    { value: "hex_color", labelKey: "preset_hex_color" },
    { value: "username", labelKey: "preset_username" },
    { value: "letters", labelKey: "preset_letters" },
    { value: "numbers", labelKey: "preset_numbers" },
    { value: "alphanumeric", labelKey: "preset_alphanumeric" },
    { value: "custom", labelKey: "preset_custom" },
]

type MatchPreview = {
    value: string
    index: number
}

const INLINE_BUTTON_CLASS =
    "inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-accent/50"

let toastPromise: Promise<typeof import("sonner")["toast"]> | null = null

async function loadToast() {
    toastPromise ??= import("sonner").then((module) => module.toast)
    return toastPromise
}

export function RegexGeneratorPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["regex_generator"] as Record<string, string>
    const notifyError = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.error(message)
    }, [])
    const notifySuccess = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.success(message)
    }, [])

    const [preset, setPreset] = React.useState<RegexGeneratorPreset>("email")
    const [minLength, setMinLength] = React.useState("3")
    const [maxLength, setMaxLength] = React.useState("24")
    const [customCharClass, setCustomCharClass] = React.useState("A-Za-z0-9_")
    const [anchored, setAnchored] = React.useState(true)
    const [globalFlag, setGlobalFlag] = React.useState(true)
    const [caseInsensitive, setCaseInsensitive] = React.useState(false)
    const [multiline, setMultiline] = React.useState(false)
    const [sampleText, setSampleText] = React.useState(getRegexPresetSample("email"))

    const [literal, setLiteral] = React.useState("")
    const [pattern, setPattern] = React.useState("")
    const [flags, setFlags] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [matches, setMatches] = React.useState<MatchPreview[]>([])

    const requiresLength = preset === "letters" || preset === "numbers" || preset === "alphanumeric" || preset === "custom"

    const generateRegex = React.useCallback(() => {
        try {
            const result = buildRegexGeneratorResult({
                preset,
                minLength: Number(minLength),
                maxLength: Number(maxLength),
                anchored,
                global: globalFlag,
                caseInsensitive,
                multiline,
                customCharClass,
            })

            setLiteral(result.literal)
            setPattern(result.pattern)
            setFlags(result.flags)

            if (!sampleText) {
                setMatches([])
                setError(null)
                return
            }

            const previewRegex = new RegExp(result.pattern, result.flags)
            if (result.flags.includes("g")) {
                const preview = Array.from(sampleText.matchAll(previewRegex)).map((m) => ({
                    value: m[0],
                    index: m.index ?? 0,
                }))
                setMatches(preview)
            } else {
                const single = previewRegex.exec(sampleText)
                setMatches(single ? [{ value: single[0], index: single.index ?? 0 }] : [])
            }

            setError(null)
        } catch (e: unknown) {
            setError((e instanceof Error ? e.message : String(e)) || toolT.error_invalid_regex)
            setMatches([])
        }
    }, [anchored, caseInsensitive, customCharClass, globalFlag, maxLength, minLength, multiline, preset, sampleText, toolT.error_invalid_regex])

    React.useEffect(() => {
        setSampleText(getRegexPresetSample(preset))
    }, [preset])

    React.useEffect(() => {
        generateRegex()
    }, [generateRegex])

    const handleSample = () => {
        setPreset("email")
        setAnchored(true)
        setGlobalFlag(true)
        setCaseInsensitive(false)
        setMultiline(false)
        setMinLength("3")
        setMaxLength("24")
        setCustomCharClass("A-Za-z0-9_")
        setSampleText(getRegexPresetSample("email"))
    }

    const handleClear = () => {
        setLiteral("")
        setPattern("")
        setFlags("")
        setSampleText("")
        setMatches([])
        setError(null)
    }

    const handleCopy = async () => {
        if (!literal) return
        const result = await safeClipboardWrite(literal)
        if (!result.ok) {
            await notifyError(t.common.copy_failed)
            return
        }

        await notifySuccess(t.common.copied)
    }

    const handleDownload = () => {
        if (!literal) return

        const body = `Regex literal: ${literal}\nPattern: ${pattern}\nFlags: ${flags || "(none)"}\n`
        const blob = new Blob([body], { type: "text/plain;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "regex-pattern.txt"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: t.common.sample,
            icon: TestTube2,
            onClick: handleSample,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
        },
        {
            id: "generate",
            label: toolT.generate_action,
            icon: Regex,
            onClick: generateRegex,
            variant: "default",
        },
        {
            id: "download",
            label: t.common.download,
            icon: Download,
            onClick: handleDownload,
            disabled: !literal,
        },
        {
            id: "open-tester",
            label: toolT.open_tester_action,
            icon: Link2,
            href: `/${lang}/regex-tester`,
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Regex className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-12">
                <div className="md:col-span-4 space-y-2">
                    <label className="text-sm font-medium">{toolT.pattern_type_label}</label>
                    <select
                        value={preset}
                        onChange={(event) => setPreset(event.target.value as RegexGeneratorPreset)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        {PRESET_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{toolT[option.labelKey]}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">{toolT.min_length_label}</label>
                    <Input
                        value={minLength}
                        onChange={(event) => setMinLength(event.target.value.replace(/[^0-9]/g, ""))}
                        disabled={!requiresLength}
                    />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">{toolT.max_length_label}</label>
                    <Input
                        value={maxLength}
                        onChange={(event) => setMaxLength(event.target.value.replace(/[^0-9]/g, ""))}
                        disabled={!requiresLength}
                    />
                </div>

                <div className="md:col-span-4 space-y-2">
                    <label className="text-sm font-medium">{toolT.custom_char_class_label}</label>
                    <Input
                        value={customCharClass}
                        onChange={(event) => setCustomCharClass(event.target.value)}
                        disabled={preset !== "custom"}
                        placeholder={toolT.custom_char_class_placeholder}
                    />
                </div>

                <div className="md:col-span-12 flex flex-wrap items-center gap-4 pt-1 text-sm">
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={anchored} onChange={(event) => setAnchored(event.target.checked)} />
                        {toolT.anchored_label}
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={globalFlag} onChange={(event) => setGlobalFlag(event.target.checked)} />
                        {toolT.global_label}
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={caseInsensitive} onChange={(event) => setCaseInsensitive(event.target.checked)} />
                        {toolT.ignore_case_label}
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={multiline} onChange={(event) => setMultiline(event.target.checked)} />
                        {toolT.multiline_label}
                    </label>
                </div>
            </div>

            {error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            <div className="grid min-h-[520px] flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.sample_text_label}</span>
                    </div>
                    <Textarea
                        className="h-full min-h-[400px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                        value={sampleText}
                        onChange={(event) => setSampleText(event.target.value)}
                        spellCheck={false}
                    />
                </div>

                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.generated_regex_label}</span>
                        <button
                            type="button"
                            className={INLINE_BUTTON_CLASS}
                            onClick={() => void handleCopy()}
                            disabled={!literal}
                        >
                            {t.common.copy}
                        </button>
                    </div>
                    <div className="space-y-3 p-4">
                        <div>
                            <p className="mb-1 text-xs uppercase text-muted-foreground">{toolT.literal_label}</p>
                            <Textarea className="min-h-[72px] resize-none font-mono text-sm" value={literal} readOnly />
                        </div>
                        <div>
                            <p className="mb-1 text-xs uppercase text-muted-foreground">{toolT.pattern_label}</p>
                            <Textarea className="min-h-[92px] resize-none font-mono text-sm" value={pattern} readOnly />
                        </div>
                        <div>
                            <p className="mb-1 text-xs uppercase text-muted-foreground">{toolT.flags_label}</p>
                            <Input value={flags || toolT.flags_none} readOnly className="font-mono text-sm" />
                        </div>
                        <div>
                            <p className="mb-1 text-xs uppercase text-muted-foreground">{toolT.sample_matches_label} ({matches.length})</p>
                            <div className="max-h-[180px] space-y-2 overflow-auto rounded border p-2">
                                {matches.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">{toolT.no_matches}</p>
                                ) : matches.map((match, index) => (
                                    <div key={`${match.value}-${index}`} className="rounded border bg-background px-2 py-1.5 font-mono text-xs">
                                        <span className="text-muted-foreground">#{index + 1} @ {match.index}:</span> {match.value}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
