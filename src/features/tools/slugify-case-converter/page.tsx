"use client"

import * as React from "react"
import { AlertTriangle, Copy, Info, Eraser, Type } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { CASE_STYLES, analyzeSlugQuality, convertCase, type CaseStyle } from "@/features/tools/slugify-case-converter/utils"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

type LocaleOption = "auto" | "en-US" | "tr" | "de"

export function SlugifyCaseConverterPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["slugify_case_converter"] as Record<string, string>
    const caseLabels = React.useMemo<Record<CaseStyle, string>>(() => ({
        slug: toolT.case_slug,
        camel: toolT.case_camel,
        pascal: toolT.case_pascal,
        snake: toolT.case_snake,
        kebab: toolT.case_kebab,
        constant: toolT.case_constant,
        dot: toolT.case_dot,
        title: toolT.case_title,
        sentence: toolT.case_sentence,
    }), [toolT])

    const [input, setInput] = React.useState(toolT.sample_input)
    const [locale, setLocale] = React.useState<LocaleOption>("auto")
    const [preserveAcronyms, setPreserveAcronyms] = React.useState(true)
    const [browserLocale, setBrowserLocale] = React.useState(() => (lang === "en" ? "en-US" : lang))

    React.useEffect(() => {
        if (locale !== "auto") return
        if (typeof navigator !== "undefined" && navigator.language) {
            setBrowserLocale(navigator.language)
        }
    }, [locale])

    const resolvedLocale = locale === "auto" ? browserLocale : locale

    const results = React.useMemo(() => {
        if (!input.trim()) {
            return CASE_STYLES.map((style) => ({ key: style, label: caseLabels[style], value: "" }))
        }

        return CASE_STYLES.map((style) => ({
            key: style,
            label: caseLabels[style],
            value: convertCase(input, style, {
                locale: resolvedLocale,
                preserveAcronyms,
            }),
        }))
    }, [caseLabels, input, resolvedLocale, preserveAcronyms])

    const slugValue = React.useMemo(
        () => results.find((result) => result.key === "slug")?.value || "",
        [results],
    )
    const slugQuality = React.useMemo(
        () => analyzeSlugQuality(input, slugValue),
        [input, slugValue],
    )

    const handleCopy = async (value: string) => {
        const result = await safeClipboardWrite(value)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const handleCopyAll = async () => {
        const all = results.map((result) => `${result.label}: ${result.value}`).join("\n")
        const result = await safeClipboardWrite(all)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const actions: ToolAction[] = [
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: () => setInput(""),
        },
        {
            id: "copy_all",
            label: toolT.copy_all,
            icon: Copy,
            onClick: () => void handleCopyAll(),
            disabled: !input.trim(),
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Type className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>

                <ToolActionBar actions={actions} />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">{t.common.input}</label>
                <Textarea
                    className="min-h-[100px] font-mono text-sm leading-6"
                    placeholder={toolT.input_placeholder}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    spellCheck={false}
                />
            </div>

            <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {toolT.locale_label}
                    </label>
                    <Select value={locale} onValueChange={(value) => setLocale(value as LocaleOption)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">{toolT.locale_auto}</SelectItem>
                            <SelectItem value="en-US">{toolT.locale_en}</SelectItem>
                            <SelectItem value="tr">{toolT.locale_tr}</SelectItem>
                            <SelectItem value="de">{toolT.locale_de}</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                        {(toolT.resolved_locale).replace("{locale}", resolvedLocale)}
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {toolT.acronym_label}
                    </label>
                    <div className="flex h-9 items-center justify-between rounded-md border px-3">
                        <span className="text-sm text-foreground">{toolT.preserve_acronyms}</span>
                        <Switch
                            id="preserve-acronyms"
                            checked={preserveAcronyms}
                            onCheckedChange={setPreserveAcronyms}
                        />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        {toolT.acronym_hint}
                    </p>
                </div>
            </div>

            <div className="space-y-3 rounded-lg border bg-card p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {toolT.score_label}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                            {slugQuality.score}
                            <span className="ml-1 text-sm font-medium text-muted-foreground">/100</span>
                        </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                        {{
                            excellent: toolT.score_excellent,
                            good: toolT.score_good,
                            fair: toolT.score_fair,
                            poor: toolT.score_poor,
                        }[slugQuality.level]}
                    </p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                        className={`h-full transition-[width,background-color] ${
                            slugQuality.score >= 90
                                ? "bg-emerald-500"
                                : slugQuality.score >= 75
                                    ? "bg-blue-500"
                                    : slugQuality.score >= 55
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                        }`}
                        style={{ width: `${slugQuality.score}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    {toolT.score_hint}
                </p>

                {!input.trim() ? (
                    <p className="text-xs text-muted-foreground">
                        {toolT.score_empty}
                    </p>
                ) : (
                    <div className="space-y-2">
                        {slugQuality.warnings.map((warning) => {
                            let message = ""
                            if (warning === "empty_slug") {
                                message = toolT.warning_empty_slug
                            } else if (warning === "too_short") {
                                message = (toolT.warning_too_short)
                                    .replace("{length}", String(slugQuality.slugLength))
                            } else if (warning === "too_long") {
                                message = (toolT.warning_too_long)
                                    .replace("{length}", String(slugQuality.slugLength))
                            } else {
                                message = (toolT.warning_blocked_chars)
                                    .replace("{chars}", slugQuality.blockedChars.join(" "))
                            }

                            return (
                                <div key={warning} className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>{message}</span>
                                </div>
                            )
                        })}

                        {slugQuality.hints.includes("normalized") ? (
                            <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span>{toolT.hint_normalized}</span>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {results.map((result) => (
                    <div
                        key={result.key}
                        className="group flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/30"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{result.label}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={() => void handleCopy(result.value)}
                                disabled={!result.value}
                                aria-label={`${t.common.copy} ${result.label}`}
                            >
                                <Copy className="h-3.5 w-3.5" />
                                <span className="sr-only">{`${t.common.copy} ${result.label}`}</span>
                            </Button>
                        </div>
                        <p className="min-h-[1.5rem] break-all font-mono text-sm leading-6 text-foreground">
                            {result.value || "-"}
                        </p>
                    </div>
                ))}
            </div>

            <RelatedTools toolKey="slugify_case_converter" />
        </div>
    )
}
