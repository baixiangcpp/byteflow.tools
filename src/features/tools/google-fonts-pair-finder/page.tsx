"use client"

import * as React from "react"
import { Copy, RefreshCw, Search, Sparkles, Type } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { ToolPageContainer } from "@/components/layout/page-container"

type PairTone = "all" | "modern" | "editorial" | "friendly" | "technical" | "playful"

type FontPair = {
    id: string
    name: string
    heading: string
    body: string
    tone: Exclude<PairTone, "all">
    useCaseKey: string
}

const FONT_PAIRS: FontPair[] = [
    { id: "inter-lora", name: "Inter + Lora", heading: "Inter", body: "Lora", tone: "modern", useCaseKey: "use_case_inter_lora" },
    { id: "manrope-source", name: "Manrope + Source Serif 4", heading: "Manrope", body: "Source Serif 4", tone: "modern", useCaseKey: "use_case_manrope_source" },
    { id: "playfair-lato", name: "Playfair Display + Lato", heading: "Playfair Display", body: "Lato", tone: "editorial", useCaseKey: "use_case_playfair_lato" },
    { id: "dm-serif-work", name: "DM Serif Display + Work Sans", heading: "DM Serif Display", body: "Work Sans", tone: "editorial", useCaseKey: "use_case_dm_serif_work" },
    { id: "nunito-open", name: "Nunito + Open Sans", heading: "Nunito", body: "Open Sans", tone: "friendly", useCaseKey: "use_case_nunito_open" },
    { id: "poppins-nunito", name: "Poppins + Nunito Sans", heading: "Poppins", body: "Nunito Sans", tone: "friendly", useCaseKey: "use_case_poppins_nunito" },
    { id: "ibmplex-roboto", name: "IBM Plex Sans + Roboto Mono", heading: "IBM Plex Sans", body: "Roboto Mono", tone: "technical", useCaseKey: "use_case_ibmplex_roboto" },
    { id: "jetbrains-inter", name: "JetBrains Mono + Inter", heading: "JetBrains Mono", body: "Inter", tone: "technical", useCaseKey: "use_case_jetbrains_inter" },
    { id: "baloo-mulish", name: "Baloo 2 + Mulish", heading: "Baloo 2", body: "Mulish", tone: "playful", useCaseKey: "use_case_baloo_mulish" },
    { id: "rubik-karla", name: "Rubik + Karla", heading: "Rubik", body: "Karla", tone: "playful", useCaseKey: "use_case_rubik_karla" },
]

function familyToImportName(name: string): string {
    return name.replaceAll(" ", "+")
}

function buildCssSnippet(pair: FontPair): string {
    const headingFamily = familyToImportName(pair.heading)
    const bodyFamily = familyToImportName(pair.body)
    return [
        `@import url('https://fonts.googleapis.com/css2?family=${headingFamily}:wght@400;600;700&family=${bodyFamily}:wght@400;500;600&display=swap');`,
        "",
        ":root {",
        `  --font-heading: '${pair.heading}', 'Segoe UI', sans-serif;`,
        `  --font-body: '${pair.body}', 'Inter', sans-serif;`,
        "}",
        "",
        "h1, h2, h3 {",
        "  font-family: var(--font-heading);",
        "}",
        "",
        "body, p, li, button {",
        "  font-family: var(--font-body);",
        "}",
    ].join("\n")
}

function fallbackStack(font: string): string {
    return `'${font}', "Segoe UI", "Helvetica Neue", Arial, sans-serif`
}

const FILTER_BUTTON_BASE_CLASS =
    "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

const FILTER_BUTTON_VARIANT_CLASS = {
    default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
    outline: "border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
} as const

let toastPromise: Promise<typeof import("sonner")["toast"]> | null = null

async function loadToast() {
    toastPromise ??= import("sonner").then((module) => module.toast)
    return toastPromise
}

export function GoogleFontsPairFinderPage() {
    const { t } = useLang()
    const toolT = t.tools["google_fonts_pair_finder"] as Record<string, string>
    const notifyError = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.error(message)
    }, [])
    const notifySuccess = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.success(message)
    }, [])

    const [tone, setTone] = React.useState<PairTone>("all")
    const [query, setQuery] = React.useState("")
    const [selectedId, setSelectedId] = React.useState(FONT_PAIRS[0].id)

    const toneLabels: Record<PairTone, string> = {
        all: toolT.tone_all,
        modern: toolT.tone_modern,
        editorial: toolT.tone_editorial,
        friendly: toolT.tone_friendly,
        technical: toolT.tone_technical,
        playful: toolT.tone_playful,
    }

    const getUseCase = React.useCallback(
        (pair: FontPair) => toolT[pair.useCaseKey],
        [toolT],
    )

    const filteredPairs = React.useMemo(() => {
        const keyword = query.trim().toLowerCase()
        return FONT_PAIRS.filter((pair) => {
            if (tone !== "all" && pair.tone !== tone) return false
            if (!keyword) return true
            const haystack = `${pair.name} ${pair.heading} ${pair.body} ${getUseCase(pair)}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [getUseCase, query, tone])

    const selectedPair = React.useMemo(() => {
        return filteredPairs.find((pair) => pair.id === selectedId) ?? filteredPairs[0] ?? FONT_PAIRS[0]
    }, [filteredPairs, selectedId])

    const cssSnippet = React.useMemo(() => buildCssSnippet(selectedPair), [selectedPair])

    React.useEffect(() => {
        if (!filteredPairs.some((pair) => pair.id === selectedId) && filteredPairs[0]) {
            setSelectedId(filteredPairs[0].id)
        }
    }, [filteredPairs, selectedId])

    const handleShuffle = () => {
        if (filteredPairs.length === 0) return
        const random = filteredPairs[Math.floor(Math.random() * filteredPairs.length)]
        setSelectedId(random.id)
    }

    const handleCopyCss = async () => {
        const result = await safeClipboardWrite(cssSnippet)
        if (!result.ok) {
            await notifyError(t.common.copy_failed)
            return
        }
        await notifySuccess(t.common.copied)
    }

    const actions: ToolAction[] = [
        { id: "shuffle", label: toolT.shuffle_action, icon: RefreshCw, onClick: handleShuffle, disabled: filteredPairs.length === 0 },
        { id: "copy_css", label: toolT.copy_css_action, icon: Copy, onClick: handleCopyCss },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
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

            <div className="rounded-lg border bg-card p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            className="pl-9"
                            placeholder={toolT.search_placeholder}
                            spellCheck={false}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                        {(["all", "modern", "editorial", "friendly", "technical", "playful"] as PairTone[]).map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setTone(item)}
                                className={`${FILTER_BUTTON_BASE_CLASS} ${FILTER_BUTTON_VARIANT_CLASS[tone === item ? "default" : "outline"]} capitalize`}
                            >
                                {toneLabels[item]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.pair_library_label}</span>
                        <span className="text-xs font-normal text-muted-foreground">{filteredPairs.length} {toolT.matches_label}</span>
                    </div>
                    <div className="space-y-2 overflow-auto p-3">
                        {filteredPairs.length > 0 ? (
                            filteredPairs.map((pair) => (
                                <button
                                    key={pair.id}
                                    type="button"
                                    onClick={() => setSelectedId(pair.id)}
                                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                                        selectedPair.id === pair.id
                                            ? "border-primary/40 bg-primary/10"
                                            : "bg-background hover:border-primary/30"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="text-sm font-semibold">{pair.name}</div>
                                            <div className="text-xs text-muted-foreground">{getUseCase(pair)}</div>
                                        </div>
                                        <Sparkles className="h-4 w-4 text-primary/80" />
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        {toolT.heading_label}: {pair.heading} / {toolT.body_label}: {pair.body}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">{toolT.no_matches}</div>
                        )}
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{selectedPair.name}</span>
                    </div>
                    <div className="space-y-3 border-b bg-background/40 p-3">
                        <div className="rounded-md border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.heading_label}</p>
                            <h2 style={{ fontFamily: fallbackStack(selectedPair.heading) }} className="mt-2 text-3xl font-semibold leading-tight">
                                {toolT.preview_heading}
                            </h2>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.body_label}</p>
                            <p style={{ fontFamily: fallbackStack(selectedPair.body) }} className="mt-2 text-sm leading-7 text-muted-foreground">
                                {toolT.preview_body}
                            </p>
                        </div>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={cssSnippet}
                            className="h-full min-h-[220px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>

            <RelatedTools toolKey="google_fonts_pair_finder" />
        </ToolPageContainer>
    )
}
