"use client"

import * as React from "react"
import {
    ArrowDown,
    ArrowUp,
    BookOpen,
    Copy,
    Download,
    FileInput,
    FolderOpen,
    Link2,
    Play,
    Plus,
    Save,
    Trash2,
    Workflow,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { getToolHandoffFromSearchParams } from "@/core/routing/tool-handoff"
import { PIPELINE_TOOL_ADAPTERS } from "@/features/pipeline/adapter-registry"
import { decodeRecipeFromUrlParam, encodeRecipeForShareUrl } from "@/features/pipeline/recipe-codec"
import { runRecipe, validateRecipe } from "@/features/pipeline/executor"
import { exportRecipeToJson, importRecipeFromJson } from "@/features/pipeline/recipe-import-export"
import { createRecipeFromTemplate, PIPELINE_RECIPE_TEMPLATES, type PipelineRecipeTemplate } from "@/features/pipeline/recipe-templates"
import {
    deleteSavedRecipe,
    isRecipeStoreAvailable,
    listSavedRecipes,
    loadSavedRecipe,
    saveRecipeRecord,
    type SavedRecipeRecord,
} from "@/features/pipeline/recipe-store"
import type { PipelineExecutionResult, RecipeDocument, RecipeStep } from "@/features/pipeline/recipe-types"
import { StepOptions } from "./components"
import { downloadText } from "./browser-actions"
import { FIRST_ADAPTER, SHARE_PARAM } from "./constants"
import { createId, createRecipe, createStep, updateRecipeTimestamp } from "./logic"
import type { OptionValue } from "./types"

export function PipelineBuilderPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["pipeline_builder"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const [recipe, setRecipe] = React.useState<RecipeDocument>(() => createRecipe())
    const [selectedStepId, setSelectedStepId] = React.useState<string | null>(null)
    const [pendingToolKey, setPendingToolKey] = React.useState(FIRST_ADAPTER.toolKey)
    const [initialInput, setInitialInput] = React.useState("")
    const [result, setResult] = React.useState<PipelineExecutionResult | null>(null)
    const [isRunning, setIsRunning] = React.useState(false)
    const [savedRecipes, setSavedRecipes] = React.useState<SavedRecipeRecord[]>([])
    const [selectedSavedId, setSelectedSavedId] = React.useState("")
    const [storageAvailable, setStorageAvailable] = React.useState(false)
    const [storageMessage, setStorageMessage] = React.useState<string | null>(null)
    const [importError, setImportError] = React.useState<string | null>(null)

    const selectedStep = recipe.steps.find((step) => step.id === selectedStepId) ?? recipe.steps[0] ?? null
    const validation = React.useMemo(() => validateRecipe(recipe), [recipe])
    const finalOutput = result?.finalOutput ?? ""

    const refreshSavedRecipes = React.useCallback(async () => {
        if (!storageAvailable) {
            setSavedRecipes([])
            setSelectedSavedId("")
            setStorageMessage(text("storage_unavailable"))
            return
        }
        const listed = await listSavedRecipes()
        if (!listed.ok) {
            setStorageMessage(listed.error)
            return
        }
        setStorageMessage(null)
        setSavedRecipes(listed.value)
    }, [storageAvailable, text])

    React.useEffect(() => {
        const available = isRecipeStoreAvailable()
        setStorageAvailable(available)
        setStorageMessage(available ? null : text("storage_unavailable"))
    }, [text])

    React.useEffect(() => {
        if (!storageAvailable) return
        void refreshSavedRecipes()
    }, [refreshSavedRecipes, storageAvailable])

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const recipeParam = params.get(SHARE_PARAM)
        if (recipeParam) {
            const decoded = decodeRecipeFromUrlParam(recipeParam)
            if (decoded.ok) {
                const decodedValidation = validateRecipe(decoded.recipe)
                if (decodedValidation.ok) {
                    setRecipe(decoded.recipe)
                    setSelectedStepId(decoded.recipe.steps[0]?.id ?? null)
                } else {
                    setImportError(decodedValidation.errors.join("\n"))
                }
            } else {
                setImportError(decoded.error)
            }
        }

        const handoff = getToolHandoffFromSearchParams(params)
        if (handoff) {
            setInitialInput(handoff)
            toast.success(text("handoff_loaded"))
        }
    }, [text])

    React.useEffect(() => {
        if (!selectedStepId && recipe.steps.length > 0) {
            setSelectedStepId(recipe.steps[0].id)
        }
    }, [recipe.steps, selectedStepId])

    const updateRecipe = React.useCallback((updater: (current: RecipeDocument) => RecipeDocument) => {
        setRecipe((current) => updateRecipeTimestamp(updater(current)))
        setResult(null)
        setImportError(null)
    }, [])

    const addStep = React.useCallback(() => {
        const step = createStep(pendingToolKey)
        updateRecipe((current) => ({
            ...current,
            steps: [...current.steps, step],
            edges: [],
        }))
        setSelectedStepId(step.id)
    }, [pendingToolKey, updateRecipe])

    const removeStep = React.useCallback((stepId: string) => {
        updateRecipe((current) => {
            const nextSteps = current.steps.filter((step) => step.id !== stepId)
            return { ...current, steps: nextSteps, edges: [] }
        })
        setSelectedStepId((current) => current === stepId ? null : current)
    }, [updateRecipe])

    const moveStep = React.useCallback((stepId: string, direction: -1 | 1) => {
        updateRecipe((current) => {
            const index = current.steps.findIndex((step) => step.id === stepId)
            const nextIndex = index + direction
            if (index < 0 || nextIndex < 0 || nextIndex >= current.steps.length) return current
            const steps = [...current.steps]
            const [step] = steps.splice(index, 1)
            steps.splice(nextIndex, 0, step)
            return { ...current, steps, edges: [] }
        })
    }, [updateRecipe])

    const updateStep = React.useCallback((stepId: string, updater: (step: RecipeStep) => RecipeStep) => {
        updateRecipe((current) => ({
            ...current,
            steps: current.steps.map((step) => step.id === stepId ? updater(step) : step),
        }))
    }, [updateRecipe])

    const updateStepOption = React.useCallback((stepId: string, key: string, value: OptionValue) => {
        updateStep(stepId, (step) => ({
            ...step,
            options: {
                ...step.options,
                [key]: value,
            },
        }))
    }, [updateStep])

    const runCurrentRecipe = React.useCallback(async () => {
        setIsRunning(true)
        try {
            const execution = await runRecipe(recipe, initialInput)
            setResult(execution)
            if (execution.ok) {
                toast.success(text("run_complete"))
            } else {
                toast.error(text("run_failed"))
            }
        } finally {
            setIsRunning(false)
        }
    }, [initialInput, recipe, text])

    const saveRecipe = React.useCallback(async () => {
        if (!storageAvailable) {
            setStorageMessage(text("storage_unavailable"))
            return
        }
        const saveResult = await saveRecipeRecord(recipe)
        if (!saveResult.ok) {
            setStorageMessage(saveResult.error)
            toast.error(saveResult.error)
            return
        }
        toast.success(text("recipe_saved"))
        await refreshSavedRecipes()
    }, [recipe, refreshSavedRecipes, storageAvailable, text])

    const loadRecipe = React.useCallback(async () => {
        if (!storageAvailable || !selectedSavedId) return
        const loadResult = await loadSavedRecipe(selectedSavedId)
        if (!loadResult.ok) {
            toast.error(loadResult.error)
            return
        }
        if (!loadResult.value) {
            toast.error(text("recipe_missing"))
            return
        }
        setRecipe(loadResult.value.recipe)
        setSelectedStepId(loadResult.value.recipe.steps[0]?.id ?? null)
        setResult(null)
        toast.success(text("recipe_loaded"))
    }, [selectedSavedId, storageAvailable, text])

    const deleteRecipe = React.useCallback(async () => {
        if (!storageAvailable || !selectedSavedId) return
        const deleteResult = await deleteSavedRecipe(selectedSavedId)
        if (!deleteResult.ok) {
            toast.error(deleteResult.error)
            return
        }
        setSelectedSavedId("")
        toast.success(text("recipe_deleted"))
        await refreshSavedRecipes()
    }, [refreshSavedRecipes, selectedSavedId, storageAvailable, text])

    const exportRecipe = React.useCallback(() => {
        downloadText(`${recipe.name.trim().replace(/[^\w.-]+/g, "-") || "byteflow-recipe"}.json`, exportRecipeToJson(recipe))
        toast.success(text("recipe_exported"))
    }, [recipe, text])

    const importRecipe = React.useCallback(async (file: File) => {
        const source = await file.text()
        const imported = importRecipeFromJson(source)
        if (!imported.ok) {
            const message = imported.errors.join("\n")
            setImportError(message)
            toast.error(text("import_failed"))
            return
        }
        setRecipe(imported.recipe)
        setSelectedStepId(imported.recipe.steps[0]?.id ?? null)
        setResult(null)
        setImportError(null)
        toast.success(text("recipe_imported"))
    }, [text])

    const shareRecipe = React.useCallback(async () => {
        const encoded = encodeRecipeForShareUrl(recipe)
        const url = `${window.location.origin}/${lang}/pipeline-builder?${SHARE_PARAM}=${encodeURIComponent(encoded)}`
        const copied = await safeClipboardWrite(url)
        if (!copied.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(text("share_copied"))
    }, [lang, recipe, t.common.copy_failed, text])

    const copyOutput = React.useCallback(async () => {
        if (!finalOutput) return
        const copied = await safeClipboardWrite(finalOutput)
        if (!copied.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }, [finalOutput, t.common.copied, t.common.copy_failed])

    const loadTemplate = React.useCallback((template: PipelineRecipeTemplate) => {
        const generated = createRecipeFromTemplate(template, {
            recipeId: createId("recipe"),
            createStepId: (index) => createId(`step${index + 1}`),
            translate: text,
        })
        setRecipe(generated.recipe)
        setInitialInput(generated.initialInput)
        setSelectedStepId(generated.recipe.steps[0]?.id ?? null)
        setResult(null)
        setImportError(null)
        toast.success(text("template_loaded"))
    }, [text])

    const loadSample = React.useCallback(() => {
        loadTemplate(PIPELINE_RECIPE_TEMPLATES[0])
    }, [loadTemplate])

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.try_example, icon: FileInput, onClick: loadSample },
        { id: "run", label: isRunning ? text("running") : text("run_recipe"), icon: Play, onClick: () => void runCurrentRecipe(), disabled: isRunning || recipe.steps.length === 0 },
        { id: "save", label: text("save_recipe"), icon: Save, onClick: () => void saveRecipe(), disabled: !storageAvailable },
        { id: "export", label: text("export_recipe"), icon: Download, onClick: exportRecipe },
        { id: "share", label: text("share_recipe"), icon: Link2, onClick: () => void shareRecipe() },
        { id: "copy_output", label: t.common.copy, icon: Copy, onClick: () => void copyOutput(), disabled: !finalOutput },
    ]

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Workflow className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{text("description")}</p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
                {text("privacy_note")}
            </div>

            <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)_360px]">
                <aside className="space-y-4">
                    <section className="rounded-lg border bg-card p-4">
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="recipe-name">{text("recipe_name")}</Label>
                                <Input
                                    id="recipe-name"
                                    value={recipe.name}
                                    onChange={(event) => updateRecipe((current) => ({ ...current, name: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="recipe-description">{text("recipe_description")}</Label>
                                <Input
                                    id="recipe-description"
                                    value={recipe.description ?? ""}
                                    onChange={(event) => updateRecipe((current) => ({ ...current, description: event.target.value }))}
                                    placeholder={text("recipe_description_placeholder")}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-lg border bg-card p-4">
                        <div className="flex items-start gap-2">
                            <BookOpen className="mt-0.5 h-4 w-4 text-primary" />
                            <div>
                                <h2 className="text-sm font-semibold">{text("templates_title")}</h2>
                                <p className="mt-1 text-xs text-muted-foreground">{text("templates_description")}</p>
                            </div>
                        </div>
                        <div className="mt-3 space-y-2">
                            {PIPELINE_RECIPE_TEMPLATES.map((template) => (
                                <div key={template.id} className="rounded-md border bg-background p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">{text(template.titleKey)}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{text(template.descriptionKey)}</p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="shrink-0"
                                            onClick={() => loadTemplate(template)}
                                        >
                                            {text("use_template")}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-sm font-semibold">{text("steps_title")}</h2>
                            <span className="text-xs text-muted-foreground">{recipe.steps.length}/{recipe.settings.maxSteps}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <select
                                aria-label={text("adapter_select")}
                                className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
                                value={pendingToolKey}
                                onChange={(event) => setPendingToolKey(event.target.value)}
                            >
                                {PIPELINE_TOOL_ADAPTERS.map((adapter) => (
                                    <option key={adapter.toolKey} value={adapter.toolKey}>
                                        {(t.tools[adapter.toolKey] as Record<string, string> | undefined)?.title ?? adapter.toolKey}
                                    </option>
                                ))}
                            </select>
                            <Button size="sm" onClick={addStep} disabled={recipe.steps.length >= recipe.settings.maxSteps}>
                                <Plus className="h-4 w-4" />
                                {text("add_step")}
                            </Button>
                        </div>
                        <div className="mt-4 space-y-2">
                            {recipe.steps.length === 0 ? (
                                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{text("no_steps")}</div>
                            ) : recipe.steps.map((step, index) => {
                                const adapterTitle = (t.tools[step.toolKey] as Record<string, string> | undefined)?.title ?? step.toolKey
                                const active = step.id === selectedStep?.id
                                return (
                                    <div
                                        key={step.id}
                                        className={`flex w-full items-start justify-between gap-2 rounded-md border p-3 text-sm transition-colors ${active ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/50"}`}
                                    >
                                        <button
                                            type="button"
                                            className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            onClick={() => setSelectedStepId(step.id)}
                                            aria-pressed={active}
                                        >
                                            <span className="block min-w-0">
                                                <span className="block font-medium">{index + 1}. {step.label || adapterTitle}</span>
                                                <span className="block truncate text-xs text-muted-foreground">{adapterTitle}</span>
                                            </span>
                                        </button>
                                        <div className="flex shrink-0 gap-1">
                                            <button
                                                type="button"
                                                className="rounded p-1 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    moveStep(step.id, -1)
                                                }}
                                                disabled={index === 0}
                                                aria-label={text("move_up")}
                                            >
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded p-1 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    moveStep(step.id, 1)
                                                }}
                                                disabled={index === recipe.steps.length - 1}
                                                aria-label={text("move_down")}
                                            >
                                                <ArrowDown className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded p-1 text-destructive hover:bg-destructive/10"
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    removeStep(step.id)
                                                }}
                                                aria-label={text("remove_step")}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    <section className="rounded-lg border bg-card p-4">
                        <h2 className="text-sm font-semibold">{text("saved_recipes")}</h2>
                        <div className="mt-3 flex gap-2">
                            <select
                                aria-label={text("saved_recipe_select")}
                                className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
                                value={selectedSavedId}
                                onChange={(event) => setSelectedSavedId(event.target.value)}
                                disabled={!storageAvailable || savedRecipes.length === 0}
                            >
                                <option value="">{text("select_saved_recipe")}</option>
                                {savedRecipes.map((record) => (
                                    <option key={record.id} value={record.id}>{record.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => void loadRecipe()} disabled={!storageAvailable || !selectedSavedId}>
                                <FolderOpen className="h-4 w-4" />
                                {text("load_recipe")}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => void deleteRecipe()} disabled={!storageAvailable || !selectedSavedId}>
                                <Trash2 className="h-4 w-4" />
                                {text("delete_recipe")}
                            </Button>
                        </div>
                        {storageMessage ? <p className="mt-2 text-xs text-muted-foreground">{storageMessage}</p> : null}
                    </section>
                </aside>

                <main className="space-y-4">
                    <section className="rounded-lg border bg-card p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <Label htmlFor="pipeline-input">{text("initial_input")}</Label>
                            <span className="text-xs text-muted-foreground">{initialInput.length} chars</span>
                        </div>
                        <Textarea
                            id="pipeline-input"
                            value={initialInput}
                            onChange={(event) => {
                                setInitialInput(event.target.value)
                                setResult(null)
                            }}
                            placeholder={text("initial_input_placeholder")}
                            className="min-h-[220px] font-mono text-sm"
                            spellCheck={false}
                        />
                    </section>

                    <section className="rounded-lg border bg-card p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <Label>{text("final_output")}</Label>
                            <span className="text-xs text-muted-foreground">{finalOutput.length} chars</span>
                        </div>
                        <Textarea
                            value={finalOutput}
                            readOnly
                            placeholder={text("final_output_placeholder")}
                            className="min-h-[260px] bg-muted font-mono text-sm"
                            spellCheck={false}
                        />
                    </section>

                    <section className="rounded-lg border bg-card p-4">
                        <h2 className="text-sm font-semibold">{text("run_log")}</h2>
                        <div className="mt-3 overflow-hidden rounded-md border">
                            {result ? (
                                <table className="w-full text-sm">
                                    <thead className="bg-muted text-xs text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2 text-left">{text("table_step")}</th>
                                            <th className="px-3 py-2 text-left">{text("table_status")}</th>
                                            <th className="px-3 py-2 text-left">{text("table_bytes")}</th>
                                            <th className="px-3 py-2 text-left">{text("table_message")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.steps.map((step) => (
                                            <tr key={step.stepId} className="border-t">
                                                <td className="px-3 py-2 font-mono text-xs">{step.stepId}</td>
                                                <td className="px-3 py-2">{step.ok ? text("status_ok") : text("status_failed")}</td>
                                                <td className="px-3 py-2 text-xs text-muted-foreground">{step.inputBytes} {"->"} {step.outputBytes}</td>
                                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                                    {step.error?.message || step.warnings.join("; ") || text("no_message")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-4 text-sm text-muted-foreground">{text("run_log_empty")}</div>
                            )}
                        </div>
                        {result?.errors.length ? (
                            <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                {result.errors.join("\n")}
                            </div>
                        ) : null}
                    </section>
                </main>

                <aside className="space-y-4">
                    <section className="rounded-lg border bg-card p-4">
                        <h2 className="text-sm font-semibold">{text("selected_step")}</h2>
                        {selectedStep ? (
                            <div className="mt-3 space-y-3">
                                <div>
                                    <Label htmlFor="step-label">{text("step_label")}</Label>
                                    <Input
                                        id="step-label"
                                        value={selectedStep.label ?? ""}
                                        onChange={(event) => updateStep(selectedStep.id, (step) => ({ ...step, label: event.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label>{text("input_mode")}</Label>
                                    <div className="mt-1 grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={selectedStep.inputMode === "previous_output" ? "default" : "outline"}
                                            onClick={() => updateStep(selectedStep.id, (step) => ({ ...step, inputMode: "previous_output", constantInput: undefined }))}
                                        >
                                            {text("previous_output")}
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={selectedStep.inputMode === "constant" ? "default" : "outline"}
                                            onClick={() => updateStep(selectedStep.id, (step) => ({ ...step, inputMode: "constant", constantInput: step.constantInput ?? "" }))}
                                        >
                                            {text("constant_input")}
                                        </Button>
                                    </div>
                                </div>
                                {selectedStep.inputMode === "constant" ? (
                                    <div>
                                        <Label htmlFor="constant-input">{text("constant_input")}</Label>
                                        <Textarea
                                            id="constant-input"
                                            value={selectedStep.constantInput ?? ""}
                                            onChange={(event) => updateStep(selectedStep.id, (step) => ({ ...step, constantInput: event.target.value }))}
                                            placeholder={text("constant_input_placeholder")}
                                            className="min-h-[120px] font-mono text-xs"
                                        />
                                    </div>
                                ) : null}
                                <div className="space-y-3 rounded-md border p-3">
                                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">{text("step_options")}</h3>
                                    <StepOptions
                                        step={selectedStep}
                                        updateOption={(key, value) => updateStepOption(selectedStep.id, key, value)}
                                        text={text}
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">{text("select_step_empty")}</p>
                        )}
                    </section>

                    <section className="rounded-lg border bg-card p-4">
                        <h2 className="text-sm font-semibold">{text("import_export")}</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <FileInput className="h-4 w-4" />
                                {text("import_recipe")}
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportRecipe}>
                                <Download className="h-4 w-4" />
                                {text("export_recipe")}
                            </Button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/json,.json"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) void importRecipe(file)
                                event.currentTarget.value = ""
                            }}
                        />
                        {importError ? (
                            <pre className="mt-3 max-h-36 overflow-auto rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive whitespace-pre-wrap">
                                {importError}
                            </pre>
                        ) : null}
                    </section>

                    <section className="rounded-lg border bg-card p-4">
                        <h2 className="text-sm font-semibold">{text("validation")}</h2>
                        {validation.ok ? (
                            <p className="mt-2 text-sm text-muted-foreground">{text("validation_ok")}</p>
                        ) : (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
                                {validation.errors.map((error) => <li key={error}>{error}</li>)}
                            </ul>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    )
}
