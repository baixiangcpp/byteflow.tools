"use client"

import { ModeButton, OptionSwitch } from "./components"
import * as React from "react"
import { Copy, KeyRound, RefreshCw, Save, ShieldCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { readStorageString, removeStorageKey, writeStorageString } from "@/core/storage/tool-persistence"
import {
    DEFAULT_PASSPHRASE_OPTIONS,
    DEFAULT_RANDOM_OPTIONS,
    estimateStrength,
    generatePasswordBatch,
    PASSWORD_POLICY_PRESETS,
    type PasswordMode,
    type SavedPasswordPreset,
} from "@/features/tools/password-generator/utils"
import { MAX_CUSTOM_PRESETS, SEPARATOR_MAP, STORAGE_KEY } from "./constants"
import { clamp, getSeparatorKey, parsePreset } from "./logic"
import type { SeparatorKey } from "./types"

export function PasswordGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["password_generator"] as Record<string, string>

    const text = React.useCallback((key: string) => toolT[key], [toolT])

    const [mode, setMode] = React.useState<PasswordMode>("random")
    const [randomOptions, setRandomOptions] = React.useState(DEFAULT_RANDOM_OPTIONS)
    const [passphraseOptions, setPassphraseOptions] = React.useState(DEFAULT_PASSPHRASE_OPTIONS)
    const [batchCount, setBatchCount] = React.useState(1)
    const [results, setResults] = React.useState<string[]>([])
    const [presetName, setPresetName] = React.useState("")
    const [savedPresets, setSavedPresets] = React.useState<SavedPasswordPreset[]>([])
    const [activePresetId, setActivePresetId] = React.useState("balanced")

    React.useEffect(() => {
        try {
            const raw = readStorageString(STORAGE_KEY)
            if (!raw) return
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) return
            const normalized = parsed
                .map((item) => parsePreset(item))
                .filter((item): item is SavedPasswordPreset => item !== null && item.id.length > 0 && item.name.length > 0)
                .slice(0, MAX_CUSTOM_PRESETS)
            setSavedPresets(normalized)
        } catch {
            setSavedPresets([])
        }
    }, [])

    React.useEffect(() => {
        if (savedPresets.length === 0) {
            removeStorageKey(STORAGE_KEY)
            return
        }
        writeStorageString(STORAGE_KEY, JSON.stringify(savedPresets))
    }, [savedPresets])

    const regenerate = React.useCallback((count: number) => {
        try {
            setResults(generatePasswordBatch({
                mode,
                random: randomOptions,
                passphrase: passphraseOptions,
                count,
            }))
        } catch (error) {
            setResults([])
            toast.error(error instanceof Error ? error.message : text("crypto_unavailable"))
        }
    }, [mode, passphraseOptions, randomOptions, text])

    React.useEffect(() => {
        regenerate(batchCount)
    }, [batchCount, regenerate])

    const handleGenerateNow = () => {
        regenerate(batchCount)
    }

    const handleGenerate20 = () => {
        setBatchCount(20)
        regenerate(20)
    }

    const handleCopyPrimary = async () => {
        const first = results[0]
        if (!first) return
        const result = await safeClipboardWrite(first)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: text("copy_password"),
        })
    }

    const handleCopyAll = async () => {
        if (!results.length) return
        const result = await safeClipboardWrite(results.join("\n"))
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: `${results.length} ${text("copy_all_desc")}`,
        })
    }

    const applyPreset = (preset: {
        id: string
        mode: PasswordMode
        random: typeof randomOptions
        passphrase: typeof passphraseOptions
        batchCount: number
    }) => {
        setMode(preset.mode)
        setRandomOptions(preset.random)
        setPassphraseOptions(preset.passphrase)
        setBatchCount(clamp(preset.batchCount, 1, 100))
        setActivePresetId(preset.id)
    }

    const handleSavePreset = () => {
        const name = presetName.trim()
        if (!name) return

        const customPreset: SavedPasswordPreset = {
            id: `custom-${Date.now()}`,
            name,
            mode,
            random: randomOptions,
            passphrase: passphraseOptions,
            batchCount,
        }

        setSavedPresets((current) => [customPreset, ...current].slice(0, MAX_CUSTOM_PRESETS))
        setPresetName("")
        toast.success(text("preset_saved"))
    }

    const handleDeletePreset = (id: string) => {
        setSavedPresets((current) => current.filter((item) => item.id !== id))
        toast.success(text("preset_deleted"))
    }

    const strength = React.useMemo(() => estimateStrength({
        mode,
        random: randomOptions,
        passphrase: passphraseOptions,
    }), [mode, randomOptions, passphraseOptions])

    const strengthLabel = (() => {
        if (strength.label === "weak") return text("strength_weak")
        if (strength.label === "fair") return text("strength_fair")
        if (strength.label === "good") return text("strength_good")
        return text("strength_strong")
    })()

    const strengthColor = strength.fraction <= 1
        ? "bg-red-500"
        : strength.fraction === 2
            ? "bg-yellow-500"
            : strength.fraction === 3
                ? "bg-blue-500"
                : "bg-green-500"

    const outputActions: ToolAction[] = [
        {
            id: "generate",
            label: text("generate"),
            icon: RefreshCw,
            onClick: handleGenerateNow,
        },
        {
            id: "generate20",
            label: text("generate_20"),
            onClick: handleGenerate20,
        },
        {
            id: "copyAll",
            label: text("copy_all"),
            icon: Copy,
            onClick: () => void handleCopyAll(),
            disabled: !results.length,
            variant: "default",
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <KeyRound className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {text("description")}
                    </p>
                </div>
            </div>

            <SensitiveInputWarning variant="secret" />

            <div className="rounded-lg border bg-card p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {text("mode_label")}
                </div>
                <div className="flex flex-wrap gap-2">
                    <ModeButton
                        active={mode === "random"}
                        onClick={() => setMode("random")}
                        label={text("mode_random")}
                    />
                    <ModeButton
                        active={mode === "passphrase"}
                        onClick={() => setMode("passphrase")}
                        label={text("mode_passphrase")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                <div className="md:col-span-4 lg:col-span-4">
                    <div className="space-y-5 rounded-lg border bg-card p-5 shadow-sm">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {text("policy_templates")}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {PASSWORD_POLICY_PRESETS.map((preset) => (
                                    <Button
                                        key={preset.id}
                                        type="button"
                                        size="sm"
                                        variant={activePresetId === preset.id ? "default" : "outline"}
                                        onClick={() => applyPreset(preset)}
                                    >
                                        {text(preset.labelKey)}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {mode === "random" ? (
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {text("random_settings")}
                                </h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{text("password_length")}</label>
                                    <Input
                                        type="number"
                                        min={4}
                                        max={128}
                                        value={randomOptions.length}
                                        aria-label={text("password_length")}
                                        onChange={(event) => {
                                            const value = clamp(Number(event.target.value || 16), 4, 128)
                                            setRandomOptions((current) => ({ ...current, length: value }))
                                        }}
                                    />
                                </div>

                                <OptionSwitch
                                    label={text("include_uppercase")}
                                    checked={randomOptions.includeUppercase}
                                    onCheckedChange={(checked) => setRandomOptions((current) => ({ ...current, includeUppercase: checked }))}
                                />
                                <OptionSwitch
                                    label={text("include_lowercase")}
                                    checked={randomOptions.includeLowercase}
                                    onCheckedChange={(checked) => setRandomOptions((current) => ({ ...current, includeLowercase: checked }))}
                                />
                                <OptionSwitch
                                    label={text("include_numbers")}
                                    checked={randomOptions.includeNumbers}
                                    onCheckedChange={(checked) => setRandomOptions((current) => ({ ...current, includeNumbers: checked }))}
                                />
                                <OptionSwitch
                                    label={text("include_symbols")}
                                    checked={randomOptions.includeSymbols}
                                    onCheckedChange={(checked) => setRandomOptions((current) => ({ ...current, includeSymbols: checked }))}
                                />
                                <OptionSwitch
                                    label={text("exclude_similar")}
                                    checked={randomOptions.excludeSimilar}
                                    onCheckedChange={(checked) => setRandomOptions((current) => ({ ...current, excludeSimilar: checked }))}
                                />

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{text("custom_charset")}</label>
                                    <Input
                                        value={randomOptions.customCharset}
                                        placeholder={text("custom_charset_placeholder")}
                                        onChange={(event) => setRandomOptions((current) => ({ ...current, customCharset: event.target.value }))}
                                    />
                                </div>
                            </div>
                        ) : null}

                        {mode === "passphrase" ? (
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {text("passphrase_settings")}
                                </h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{text("word_count")}</label>
                                    <Input
                                        type="number"
                                        min={2}
                                        max={12}
                                        value={passphraseOptions.wordCount}
                                        aria-label={text("word_count")}
                                        onChange={(event) => {
                                            const value = clamp(Number(event.target.value || 4), 2, 12)
                                            setPassphraseOptions((current) => ({ ...current, wordCount: value }))
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{text("separator")}</label>
                                    <Select
                                        value={getSeparatorKey(passphraseOptions.separator)}
                                        onValueChange={(value) => {
                                            const key = value as SeparatorKey
                                            setPassphraseOptions((current) => ({ ...current, separator: SEPARATOR_MAP[key] }))
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="space">{text("separator_space")}</SelectItem>
                                            <SelectItem value="hyphen">{text("separator_hyphen")}</SelectItem>
                                            <SelectItem value="underscore">{text("separator_underscore")}</SelectItem>
                                            <SelectItem value="dot">{text("separator_dot")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <OptionSwitch
                                    label={text("capitalize_words")}
                                    checked={passphraseOptions.capitalizeWords}
                                    onCheckedChange={(checked) => setPassphraseOptions((current) => ({ ...current, capitalizeWords: checked }))}
                                />
                                <OptionSwitch
                                    label={text("append_number")}
                                    checked={passphraseOptions.appendNumber}
                                    onCheckedChange={(checked) => setPassphraseOptions((current) => ({ ...current, appendNumber: checked }))}
                                />
                                <OptionSwitch
                                    label={text("append_symbol")}
                                    checked={passphraseOptions.appendSymbol}
                                    onCheckedChange={(checked) => setPassphraseOptions((current) => ({ ...current, appendSymbol: checked }))}
                                />
                            </div>
                        ) : null}

                        <div className="space-y-2 border-t pt-4">
                            <label className="text-sm font-medium">{text("batch_count")}</label>
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={batchCount}
                                aria-label={text("batch_count")}
                                onChange={(event) => setBatchCount(clamp(Number(event.target.value || 1), 1, 100))}
                            />
                            <p className="text-xs text-muted-foreground">
                                {text("batch_hint")}
                            </p>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {text("save_preset")}
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={presetName}
                                    placeholder={text("preset_name_placeholder")}
                                    aria-label={text("preset_name_placeholder")}
                                    onChange={(event) => setPresetName(event.target.value)}
                                />
                                <Button type="button" variant="outline" onClick={handleSavePreset} disabled={!presetName.trim()}>
                                    <Save className="mr-1 h-4 w-4" />
                                    {text("save")}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {text("saved_presets")}
                            </label>
                            {savedPresets.length === 0 ? (
                                <p className="text-xs text-muted-foreground">{text("preset_empty")}</p>
                            ) : (
                                <div className="space-y-2">
                                    {savedPresets.map((preset) => (
                                        <div key={preset.id} className="flex items-center justify-between rounded-md border bg-muted/20 px-2 py-2">
                                            <span className="truncate pr-2 text-sm">{preset.name}</span>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs"
                                                    onClick={() => applyPreset(preset)}
                                                >
                                                    {text("apply")}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs text-destructive"
                                                    aria-label={`${text("preset_deleted")}: ${preset.name}`}
                                                    onClick={() => handleDeletePreset(preset.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="md:col-span-8 lg:col-span-8">
                    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{text("generated_output")} ({results.length})</span>
                            <ToolActionBar actions={outputActions} />
                        </div>

                        <div className="space-y-4 p-4">
                            <div className="rounded-lg border bg-muted/25 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            {text("strength")}
                                        </p>
                                        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                            <ShieldCheck className="h-4 w-4 text-primary" />
                                            {strengthLabel}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {(text("entropy_bits")).replace("{bits}", strength.entropy.toFixed(1))}
                                        </p>
                                    </div>

                                    <Button variant="outline" size="sm" onClick={() => void handleCopyPrimary()} disabled={!results.length}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        {text("copy_password")}
                                    </Button>
                                </div>

                                <div className="mt-3 flex gap-1">
                                    <div className={`h-1.5 flex-1 rounded-l-full ${strength.fraction >= 1 ? strengthColor : "bg-muted"}`} />
                                    <div className={`h-1.5 flex-1 ${strength.fraction >= 2 ? strengthColor : "bg-muted"}`} />
                                    <div className={`h-1.5 flex-1 ${strength.fraction >= 3 ? strengthColor : "bg-muted"}`} />
                                    <div className={`h-1.5 flex-1 rounded-r-full ${strength.fraction >= 4 ? strengthColor : "bg-muted"}`} />
                                </div>
                            </div>

                            <Textarea
                                readOnly
                                value={results.join("\n")}
                                className="min-h-[420px] resize-none font-mono text-sm leading-relaxed"
                                aria-label={text("generated_output")}
                                spellCheck={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <RelatedTools toolKey="password_generator" />
        </div>
    )
}
