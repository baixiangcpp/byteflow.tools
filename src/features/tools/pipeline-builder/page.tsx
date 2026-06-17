"use client"

import * as React from "react"
import {
    Copy,
    Download,
    FileInput,
    Link2,
    Play,
    Save,
    Workflow,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { getToolHandoffFromSearchParams } from "@/core/routing/tool-handoff"
import { PIPELINE_TOOL_ADAPTERS } from "@/features/pipeline/adapter-registry"
import { decodeRecipeFromUrlParam, encodeRecipeForShareUrl, recipeContainsRuntimeInput } from "@/features/pipeline/recipe-codec"
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
import { createId, createRecipe, createStep, getStepCompatibilityHints, updateRecipeTimestamp } from "./logic"
import { PipelineRunLog } from "./pipeline-run-log"
import { PipelineSavedRecipes } from "./pipeline-saved-recipes"
import { PipelineStepList } from "./pipeline-step-list"
import { PipelineTemplateList } from "./pipeline-template-list"
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
    const compatibilityHints = React.useMemo(() => getStepCompatibilityHints(recipe.steps), [recipe.steps])
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
        toast.success(recipeContainsRuntimeInput(recipe) ? text("share_copied_without_runtime_input") : text("share_copied"))
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

                    <PipelineTemplateList
                        onLoadTemplate={loadTemplate}
                        templates={PIPELINE_RECIPE_TEMPLATES}
                        text={text}
                    />

                    <PipelineStepList
                        adapterOptions={PIPELINE_TOOL_ADAPTERS.map((adapter) => ({
                            title: (t.tools[adapter.toolKey] as Record<string, string> | undefined)?.title ?? adapter.toolKey,
                            toolKey: adapter.toolKey,
                        }))}
                        compatibilityHints={compatibilityHints}
                        maxSteps={recipe.settings.maxSteps}
                        onAddStep={addStep}
                        onMoveStep={moveStep}
                        onPendingToolKeyChange={setPendingToolKey}
                        onRemoveStep={removeStep}
                        onSelectStep={setSelectedStepId}
                        pendingToolKey={pendingToolKey}
                        selectedStepId={selectedStep?.id ?? null}
                        steps={recipe.steps}
                        text={text}
                    />

                    <PipelineSavedRecipes
                        onDeleteRecipe={() => void deleteRecipe()}
                        onLoadRecipe={() => void loadRecipe()}
                        onSelectedSavedIdChange={setSelectedSavedId}
                        savedRecipes={savedRecipes}
                        selectedSavedId={selectedSavedId}
                        storageAvailable={storageAvailable}
                        storageMessage={storageMessage}
                        text={text}
                    />
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

                    <PipelineRunLog result={result} text={text} />
                </main>

                <aside className="space-y-4">
                    <section className="rounded-lg border bg-card p-4">
                        <h2 className="text-sm font-semibold">{text("recipe_settings")}</h2>
                        <div className="mt-3 space-y-3">
                            <label className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                                <span className="min-w-0">
                                    <span className="block font-medium">{text("stop_on_error")}</span>
                                    <span className="mt-1 block text-xs text-muted-foreground">{text("stop_on_error_hint")}</span>
                                </span>
                                <Switch
                                    aria-label={text("stop_on_error")}
                                    checked={recipe.settings.stopOnError}
                                    onCheckedChange={(checked) => updateRecipe((current) => ({
                                        ...current,
                                        settings: {
                                            ...current.settings,
                                            stopOnError: checked === true,
                                        },
                                    }))}
                                />
                            </label>
                            <p className="text-xs text-muted-foreground">{text("share_runtime_input_hint")}</p>
                        </div>
                    </section>

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
