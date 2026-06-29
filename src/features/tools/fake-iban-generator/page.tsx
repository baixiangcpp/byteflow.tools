"use client"

import * as React from "react"
import { Copy, Download, Eraser, Landmark, Play, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    formatIbanForDisplay,
    generateFakeIbans,
    IBAN_COUNTRY_SPECS,
    type IbanCountry,
    validateIban,
} from "@/features/tools/fake-iban-generator/utils"

function downloadTextFile(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}

export function FakeIbanGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["fake_iban_generator"] as Record<string, string>
    const noneLabel = t.common.none
    const outputCountryLabel = toolT.output_country_label
    const outputCountLabel = toolT.output_count_label
    const outputSeedLabel = toolT.output_seed_label

    const [country, setCountry] = React.useState<IbanCountry>("DE")
    const [count, setCount] = React.useState(10)
    const [seed, setSeed] = React.useState("20260308")
    const [validationInput, setValidationInput] = React.useState("")
    const [items, setItems] = React.useState<string[]>([])
    const countryLabels = React.useMemo<Record<IbanCountry, string>>(
        () => ({
            DE: toolT.country_de,
            FR: toolT.country_fr,
            GB: toolT.country_gb,
            ES: toolT.country_es,
            IT: toolT.country_it,
            NL: toolT.country_nl,
        }),
        [toolT],
    )

    const validation = React.useMemo(() => {
        if (!validationInput.trim()) return null
        return validateIban(validationInput)
    }, [validationInput])

    const validationReason = React.useMemo(() => {
        if (!validation || validation.valid) return null

        switch (validation.reasonKey) {
            case "too_short":
                return toolT.reason_too_short
            case "invalid_length": {
                const countryCode = String(validation.reasonParams?.country || "")
                const localizedCountry = countryLabels[countryCode as IbanCountry] || countryCode
                return toolT.reason_invalid_length
                    .replace("{country}", localizedCountry ? `${localizedCountry} (${countryCode})` : countryCode)
                    .replace("{length}", String(validation.reasonParams?.length || ""))
            }
            case "invalid_prefix":
                return toolT.reason_invalid_prefix
            case "checksum_failed":
                return toolT.reason_checksum_failed
            default:
                return toolT.validation_unknown_reason
        }
    }, [countryLabels, toolT, validation])

    const generate = React.useCallback(
        (next?: Partial<{ country: IbanCountry; count: number; seed: string }>) => {
            const finalCountry = next?.country ?? country
            const finalCount = next?.count ?? count
            const finalSeed = next?.seed ?? seed
            const generated = generateFakeIbans(finalCountry, finalCount, finalSeed)
            setItems(generated)
            return generated
        },
        [count, country, seed],
    )

    React.useEffect(() => {
        setItems(generateFakeIbans(country, count, seed))
    }, [count, country, seed])

    const formattedItems = React.useMemo(() => items.map((item) => formatIbanForDisplay(item)), [items])

    const output = React.useMemo(
        () =>
            [
                `${outputCountryLabel}: ${countryLabels[country]} (${country})`,
                `${outputCountLabel}: ${items.length}`,
                `${outputSeedLabel}: ${seed || noneLabel}`,
                "",
                ...formattedItems,
            ].join("\n"),
        [country, countryLabels, formattedItems, items.length, noneLabel, outputCountLabel, outputCountryLabel, outputSeedLabel, seed],
    )

    const handleGenerate = () => {
        generate()
        toast.success(t.common.success)
    }

    const handleSample = () => {
        setCountry("DE")
        setCount(8)
        setSeed("880011")
        setValidationInput("DE89370400440532013000")
    }

    const handleReset = () => {
        setCountry("DE")
        setCount(10)
        setSeed("20260308")
        setValidationInput("")
    }

    const handleCopy = async () => {
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const handleDownload = () => downloadTextFile(output, "fake-iban-list.txt")

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "generate", label: toolT.generate_action, icon: Play, onClick: handleGenerate },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload, disabled: items.length === 0 },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Landmark className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.generator_input}</div>
                        <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3 sm:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{outputCountryLabel}</span>
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                    {IBAN_COUNTRY_SPECS.map((item) => (
                                        <button
                                            key={item.code}
                                            type="button"
                                            onClick={() => setCountry(item.code)}
                                            className={`min-h-11 rounded-md border px-3 text-left text-xs ${
                                                country === item.code
                                                    ? "border-primary/40 bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            <div className="font-semibold">{item.code}</div>
                                            <div className="line-clamp-1 text-[11px]">{countryLabels[item.code]}</div>
                                        </button>
                                    ))}
                                </div>
                            </label>
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.count_input_label}</span>
                                <Input type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value) || 1)} />
                            </label>
                            <label className="space-y-1.5 rounded-md border bg-background/80 p-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.seed_input_label}</span>
                                <Input value={seed} onChange={(event) => setSeed(event.target.value)} spellCheck={false} />
                            </label>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{t.common.validation}</div>
                        <div className="space-y-3 border-t p-3">
                            <Input
                                value={validationInput}
                                onChange={(event) => setValidationInput(event.target.value)}
                                placeholder={toolT.validation_placeholder}
                                spellCheck={false}
                            />
                            {validation ? (
                                <div className={`rounded-md border p-3 text-xs ${validation.valid ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                                    {validation.valid
                                        ? toolT.validation_valid.replace("{iban}", formatIbanForDisplay(validation.normalized))
                                        : toolT.validation_invalid.replace("{reason}", validationReason || toolT.validation_unknown_reason)}
                                </div>
                            ) : (
                                <div className="rounded-md border p-3 text-xs text-muted-foreground">{toolT.validation_empty}</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{toolT.generated_values}</span>
                    </div>
                    <div className="space-y-3 border-b bg-background/30 p-3">
                        <div className="rounded-lg border bg-background p-3">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.preview}</div>
                            <div className="max-h-40 space-y-1 overflow-auto font-mono text-xs">
                                {formattedItems.length > 0 ? (
                                    formattedItems.map((item) => (
                                        <div key={item} className="rounded border bg-background/80 px-2 py-1">
                                            {item}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-muted-foreground">{toolT.no_output}</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[260px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>

            <RelatedTools toolKey="fake_iban_generator" />
        </div>
    )
}
