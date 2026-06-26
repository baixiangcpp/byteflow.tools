"use client"

import * as React from "react"
import {
    Copy,
    Download,
    FileInput,
    Link2,
    ListChecks,
    Play,
    Save,
    Workflow,
} from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction, type ToolActionResult } from "@/features/tool-shell/tool-action-bar"
import { copyTextWithToolFeedback } from "@/features/tool-shell/tool-action-feedback"
import { useLang } from "@/core/i18n/lang-provider"
import { trackPipelineTemplateOpened } from "@/core/analytics/analytics"
import { getToolByKey } from "@/core/registry"
import { readStorageString, writeStorageString } from "@/core/storage/tool-persistence"
import { getToolHandoffFromSearchParams } from "@/core/routing/tool-handoff"
import { PIPELINE_TOOL_ADAPTERS } from "@/features/pipeline/adapter-registry"
import { decodeRecipeFromUrlParam } from "@/features/pipeline/recipe-codec"
import { runRecipe, validateRecipe } from "@/features/pipeline/executor"
import { RECIPE_STRUCTURE_PRIVACY_SCOPE } from "@/features/pipeline/recipe-sanitizer"
import { createRecipeFromTemplate, getPipelineRecipeTemplate, PIPELINE_RECIPE_TEMPLATES, type PipelineRecipeTemplate } from "@/features/pipeline/recipe-templates"
import {
    deleteSavedRecipe,
    isRecipeStoreAvailable,
    listSavedRecipes,
    loadSavedRecipe,
    saveRecipeRecord,
    type SavedRecipeRecord,
} from "@/features/pipeline/recipe-store"
import type { PipelineExecutionResult, PipelineStepExecution, RecipeDocument, RecipeStep } from "@/features/pipeline/recipe-types"
import { exportPipelineRecipe, importPipelineRecipeFile, sharePipelineRecipe } from "./action-handlers"
import { FIRST_ADAPTER, SHARE_PARAM } from "./constants"
import { createId, createRecipe, createStep, getStepCompatibilityHints, updateRecipeTimestamp } from "./logic"
import { PipelineRunLog } from "./pipeline-run-log"
import { PipelineRunSummary } from "./pipeline-run-summary"
import { PipelineOnboarding } from "./pipeline-onboarding"
import { PipelinePrivacyPreview } from "./pipeline-privacy-preview"
import { PipelineSavedRecipes } from "./pipeline-saved-recipes"
import { PipelineStepDiagnostics } from "./pipeline-step-diagnostics"
import { PipelineStepInspector } from "./pipeline-step-inspector"
import { PipelineStepList } from "./pipeline-step-list"
import { PipelineTemplateList } from "./pipeline-template-list"
import type { OptionValue } from "./types"

const ONBOARDING_DISMISSED_KEY = "byteflow:pipeline-builder:onboarding-dismissed"
const TEMPLATE_PARAM = "template"
type PendingPrivacyAction = "save" | "export" | "share"

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
    const [actionAnnouncement, setActionAnnouncement] = React.useState("")
    const [onboardingDismissed, setOnboardingDismissed] = React.useState(false)
    const [pendingPrivacyAction, setPendingPrivacyAction] = React.useState<PendingPrivacyAction | null>(null)

    const selectedStep = recipe.steps.find((step) => step.id === selectedStepId) ?? recipe.steps[0] ?? null
    const validation = React.useMemo(() => validateRecipe(recipe), [recipe])
    const compatibilityHints = React.useMemo(() => getStepCompatibilityHints(recipe.steps), [recipe.steps])
    const finalOutput = result?.finalOutput ?? ""
    const stepCountLabel = `${recipe.steps.length}/${recipe.settings.maxSteps} ${text("steps_count_label")}`

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
        setOnboardingDismissed(readStorageString(ONBOARDING_DISMISSED_KEY) === "1")
    }, [])

    React.useEffect(() => {
        if (!storageAvailable) return
        void refreshSavedRecipes()
    }, [refreshSavedRecipes, storageAvailable])

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

    const reorderStep = React.useCallback((stepId: string, targetIndex: number) => {
        updateRecipe((current) => {
            const index = current.steps.findIndex((step) => step.id === stepId)
            if (index < 0) return current
            const boundedTarget = Math.max(0, Math.min(targetIndex, current.steps.length - 1))
            if (index === boundedTarget) return current
            const steps = [...current.steps]
            const [step] = steps.splice(index, 1)
            steps.splice(boundedTarget, 0, step)
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

    const loadTemplate = React.useCallback((template: PipelineRecipeTemplate, sourcePage = "pipeline_gallery") => {
        trackPipelineTemplateOpened({
            templateId: template.id,
            language: lang,
            sourcePage,
            action: "handoff",
        })
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
    }, [lang, text])

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
        } else {
            const templateParam = params.get(TEMPLATE_PARAM)
            const template = templateParam ? getPipelineRecipeTemplate(templateParam) : undefined
            if (template) {
                loadTemplate(template, "workflow_page")
            }
        }

        const handoff = getToolHandoffFromSearchParams(params, window.location.hash)
        if (handoff) {
            setInitialInput(handoff)
            toast.success(text("handoff_loaded"))
        }
    }, [loadTemplate, text])

    React.useEffect(() => {
        if (!selectedStepId && recipe.steps.length > 0) {
            setSelectedStepId(recipe.steps[0].id)
        }
    }, [recipe.steps, selectedStepId])

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

    const performSaveRecipe = React.useCallback(async () => {
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
        setRecipe(saveResult.value.recipe)
        setSelectedStepId(saveResult.value.recipe.steps[0]?.id ?? null)
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

    const performExportRecipe = React.useCallback(() => {
        return exportPipelineRecipe(recipe, t, text, setActionAnnouncement)
    }, [recipe, t, text])

    const importRecipe = React.useCallback(async (file: File) => {
        const imported = await importPipelineRecipeFile(file, text)
        if (!imported.ok) {
            setImportError(imported.error)
            setActionAnnouncement(imported.announcement)
            return
        }
        setRecipe(imported.recipe)
        setSelectedStepId(imported.recipe.steps[0]?.id ?? null)
        setResult(null)
        setImportError(null)
        setActionAnnouncement(imported.announcement)
    }, [text])

    const performShareRecipe = React.useCallback(async () => {
        return sharePipelineRecipe(recipe, lang, t, text, setActionAnnouncement)
    }, [lang, recipe, t, text])

    const requestPrivacyPreview = React.useCallback((action: PendingPrivacyAction): ToolActionResult => {
        setPendingPrivacyAction(action)
        return {
            status: "success",
            message: text("privacy_preview_title"),
            description: text(`privacy_preview_${action}`),
        }
    }, [text])

    const cancelPrivacyPreview = React.useCallback(() => {
        setPendingPrivacyAction(null)
    }, [])

    const confirmPrivacyPreview = React.useCallback(() => {
        const action = pendingPrivacyAction
        setPendingPrivacyAction(null)
        if (action === "save") {
            void performSaveRecipe()
        } else if (action === "export") {
            performExportRecipe()
        } else if (action === "share") {
            void performShareRecipe()
        }
    }, [pendingPrivacyAction, performExportRecipe, performSaveRecipe, performShareRecipe])

    const copyText = React.useCallback(async (value?: string) => {
        if (!value) return
        return copyTextWithToolFeedback(t, value, t.common.output)
    }, [t])

    const copyOutput = React.useCallback(() => copyText(finalOutput), [copyText, finalOutput])
    const copyStepInput = React.useCallback((step: PipelineStepExecution) => void copyText(step.input), [copyText])
    const copyStepOutput = React.useCallback((step: PipelineStepExecution) => void copyText(step.output), [copyText])

    const loadSample = React.useCallback(() => {
        loadTemplate(PIPELINE_RECIPE_TEMPLATES[0], "sample_action")
    }, [loadTemplate])

    const dismissOnboarding = React.useCallback(() => {
        setOnboardingDismissed(true)
        writeStorageString(ONBOARDING_DISMISSED_KEY, "1")
    }, [])

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: FileInput, onClick: loadSample },
        { id: "run", label: isRunning ? text("running") : text("run_recipe"), icon: Play, onClick: () => void runCurrentRecipe(), disabled: isRunning || recipe.steps.length === 0 },
        { id: "save", label: text("save_recipe"), icon: Save, onClick: () => requestPrivacyPreview("save"), disabled: !storageAvailable },
        { id: "export", label: text("export_recipe"), icon: Download, onClick: () => requestPrivacyPreview("export") },
        { id: "share", label: text("share_recipe"), icon: Link2, onClick: () => requestPrivacyPreview("share") },
        { id: "copy_output", label: t.common.copy, icon: Copy, onClick: copyOutput, disabled: !finalOutput, disabledReason: t.common.action_disabled_no_output },
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
                <div className="flex flex-col items-start gap-2 md:items-end">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded-full border border-border bg-muted/40 px-3 py-1 font-medium text-foreground" aria-label={text("step_count_summary")}>
                            {stepCountLabel}
                        </span>
                        <a
                            href="#pipeline-steps"
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <ListChecks className="h-4 w-4" aria-hidden="true" />
                            {text("edit_steps")}
                        </a>
                    </div>
                    <ToolActionBar actions={actions} />
                </div>
            </div>

            <PipelineOnboarding
                dismissed={onboardingDismissed}
                onDismiss={dismissOnboarding}
                onRunSample={loadSample}
                text={text}
            />

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
                {text("privacy_note")}
            </div>

            {actionAnnouncement ? (
                <span className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-pipeline-action-status>
                    {actionAnnouncement}
                </span>
            ) : null}

            {pendingPrivacyAction ? (
                <PipelinePrivacyPreview
                    action={pendingPrivacyAction}
                    onCancel={cancelPrivacyPreview}
                    onConfirm={confirmPrivacyPreview}
                    scope={RECIPE_STRUCTURE_PRIVACY_SCOPE}
                    text={text}
                />
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)_360px]">
                <aside className="space-y-4" aria-label={text("recipe_builder")}>
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

                    <PipelineStepList
                        adapterOptions={PIPELINE_TOOL_ADAPTERS.map((adapter) => ({
                            externalRequestRequired: getToolByKey(adapter.toolKey)?.privacy.externalRequest.required === true,
                            inputKind: adapter.inputKind,
                            outputKind: adapter.outputKind,
                            title: (t.tools[adapter.toolKey] as Record<string, string> | undefined)?.title ?? adapter.toolKey,
                            toolKey: adapter.toolKey,
                        }))}
                        compatibilityHints={compatibilityHints}
                        maxSteps={recipe.settings.maxSteps}
                        onAddStep={addStep}
                        onMoveStep={moveStep}
                        onReorderStep={reorderStep}
                        onPendingToolKeyChange={setPendingToolKey}
                        onRemoveStep={removeStep}
                        onSelectStep={setSelectedStepId}
                        pendingToolKey={pendingToolKey}
                        selectedStepId={selectedStep?.id ?? null}
                        steps={recipe.steps}
                        text={text}
                    />

                    <PipelineTemplateList
                        onLoadTemplate={loadTemplate}
                        templates={PIPELINE_RECIPE_TEMPLATES}
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
                            <span id="pipeline-input-count" className="text-xs text-muted-foreground">{initialInput.length} chars</span>
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
                            aria-describedby="pipeline-input-count"
                        />
                    </section>

                    <section className="rounded-lg border bg-card p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <Label htmlFor="pipeline-output">{text("final_output")}</Label>
                            <span id="pipeline-output-count" className="text-xs text-muted-foreground">{finalOutput.length} chars</span>
                        </div>
                        <Textarea
                            id="pipeline-output"
                            value={finalOutput}
                            readOnly
                            placeholder={text("final_output_placeholder")}
                            className="min-h-[260px] bg-muted font-mono text-sm"
                            spellCheck={false}
                            aria-describedby="pipeline-output-count pipeline-run-log-status"
                        />
                    </section>

                    <PipelineRunSummary
                        isRunning={isRunning}
                        recipe={recipe}
                        result={result}
                        text={text}
                    />
                    <PipelineRunLog result={result} text={text} />
                    <PipelineStepDiagnostics
                        onCopyStepInput={(step) => void copyStepInput(step)}
                        onCopyStepOutput={(step) => void copyStepOutput(step)}
                        recipe={recipe}
                        result={result}
                        text={text}
                    />
                </main>

                <PipelineStepInspector
                    fileInputRef={fileInputRef}
                    importError={importError}
                    onExportRecipe={() => requestPrivacyPreview("export")}
                    onImportRecipe={importRecipe}
                    onUpdateRecipe={updateRecipe}
                    onUpdateStep={updateStep}
                    onUpdateStepOption={updateStepOption}
                    recipe={recipe}
                    selectedStep={selectedStep}
                    text={text}
                    validation={validation}
                />
            </div>
        </div>
    )
}
