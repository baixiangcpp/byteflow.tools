import * as React from "react"
import { Download, FileInput } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { RecipeDocument, RecipeStep, RecipeValidationResult } from "@/features/pipeline/recipe-types"
import { StepOptions } from "./components"
import type { OptionValue } from "./types"

type PipelineStepInspectorProps = {
    fileInputRef: React.RefObject<HTMLInputElement | null>
    importError: string | null
    onExportRecipe: () => void
    onImportRecipe: (file: File) => void | Promise<void>
    onUpdateRecipe: (updater: (current: RecipeDocument) => RecipeDocument) => void
    onUpdateStep: (stepId: string, updater: (step: RecipeStep) => RecipeStep) => void
    onUpdateStepOption: (stepId: string, key: string, value: OptionValue) => void
    recipe: RecipeDocument
    selectedStep: RecipeStep | null
    text: (key: string) => string
    validation: RecipeValidationResult
}

export function PipelineStepInspector({
    fileInputRef,
    importError,
    onExportRecipe,
    onImportRecipe,
    onUpdateRecipe,
    onUpdateStep,
    onUpdateStepOption,
    recipe,
    selectedStep,
    text,
    validation,
}: PipelineStepInspectorProps) {
    return (
        <aside
            id="pipeline-inspector"
            className="scroll-mt-32 space-y-4 lg:scroll-mt-24"
            aria-label={text("recipe_inspector")}
            tabIndex={-1}
        >
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
                            onCheckedChange={(checked) => onUpdateRecipe((current) => ({
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
                                intent="shortText"
                                value={selectedStep.label ?? ""}
                                onChange={(event) => onUpdateStep(selectedStep.id, (step) => ({ ...step, label: event.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>{text("input_mode")}</Label>
                            <div className="mt-1 grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={selectedStep.inputMode === "previous_output" ? "default" : "outline"}
                                    onClick={() => onUpdateStep(selectedStep.id, (step) => ({ ...step, inputMode: "previous_output" }))}
                                >
                                    {text("previous_output")}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={selectedStep.inputMode === "constant" ? "default" : "outline"}
                                    onClick={() => onUpdateStep(selectedStep.id, (step) => ({ ...step, inputMode: "constant", constantInput: step.constantInput ?? "" }))}
                                >
                                    {text("constant_input")}
                                </Button>
                            </div>
                        </div>
                        {selectedStep.inputMode === "constant" ? (
                            <div className="space-y-2">
                                <Label htmlFor="constant-input">{text("constant_input")}</Label>
                                <Textarea
                                    id="constant-input"
                                    intent="shortText"
                                    value={selectedStep.constantInput ?? ""}
                                    onChange={(event) => onUpdateStep(selectedStep.id, (step) => ({ ...step, constantInput: event.target.value }))}
                                    placeholder={text("constant_input_placeholder")}
                                    className="font-mono text-xs"
                                />
                                <p className="rounded-md border border-amber-300/60 bg-amber-50 p-2 text-xs leading-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
                                    {text("constant_input_persistence_hint")}
                                </p>
                            </div>
                        ) : null}
                        <div className="space-y-3 rounded-md border p-3">
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground">{text("step_options")}</h3>
                            <StepOptions
                                step={selectedStep}
                                updateOption={(key, value) => onUpdateStepOption(selectedStep.id, key, value)}
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
                    <Button variant="outline" size="sm" onClick={onExportRecipe}>
                        <Download className="h-4 w-4" />
                        {text("export_recipe")}
                    </Button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    data-input-intent="payload"
                    aria-label={text("import_recipe")}
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void onImportRecipe(file)
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold">{text("validation")}</h2>
                    <a
                        href="#pipeline-usage-guide"
                        className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        {text("usage_guide_link")}
                    </a>
                </div>
                {validation.ok ? (
                    <p className="mt-2 text-sm text-muted-foreground">{text("validation_ok")}</p>
                ) : (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
                        {validation.errors.map((error) => <li key={error}>{error}</li>)}
                    </ul>
                )}
                <div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
                    <div className="border-t pt-3">
                        <p className="font-medium text-foreground">{text("validation_checks_title")}</p>
                        <ul className="mt-2 list-disc space-y-1 pl-4">
                            <li>{text("validation_check_schema")}</li>
                            <li>{text("validation_check_adapters")}</li>
                            <li>{text("validation_check_options")}</li>
                            <li>{text("validation_check_edges")}</li>
                        </ul>
                    </div>
                    <div className="border-t pt-3">
                        <p>{text("validation_step_limit").replace("{count}", String(recipe.steps.length)).replace("{max}", String(recipe.settings.maxSteps))}</p>
                        <p className="mt-2">{text("validation_repeat_tools")}</p>
                        <p className="mt-2">{text("validation_linear_only")}</p>
                        <p className="mt-2">{text("validation_unsupported_combinations")}</p>
                    </div>
                </div>
            </section>
        </aside>
    )
}
