export const RECIPE_SCHEMA_VERSION = 1

export const DEFAULT_RECIPE_SETTINGS = {
    stopOnError: true,
    keepIntermediateOutputs: true,
    maxInputBytes: 2 * 1024 * 1024,
    maxOutputBytes: 2 * 1024 * 1024,
    maxSteps: 12,
} as const

export type RecipeSchemaVersion = typeof RECIPE_SCHEMA_VERSION
export type PipelineValueKind = "text" | "json" | "yaml" | "csv" | "bytes"
export type RecipeStepInputMode = "previous_output" | "constant"

export interface RecipeDocument {
    schemaVersion: RecipeSchemaVersion
    id: string
    name: string
    description?: string
    createdAt: string
    updatedAt: string
    steps: RecipeStep[]
    edges: RecipeEdge[]
    settings: RecipeSettings
}

export interface RecipeStep {
    id: string
    toolKey: string
    label?: string
    adapterVersion: number
    inputMode: RecipeStepInputMode
    constantInput?: string
    options: Record<string, unknown>
}

export interface RecipeEdge {
    fromStepId: string
    toStepId: string
}

export interface RecipeSettings {
    stopOnError: boolean
    keepIntermediateOutputs: boolean
    maxInputBytes: number
    maxOutputBytes: number
    maxSteps: number
}

export interface AdapterValidationResult {
    ok: boolean
    errors: string[]
}

export interface AdapterRunResult<Output = string> {
    ok: boolean
    output?: Output
    warnings?: string[]
    error?: {
        code: string
        message: string
    }
    metrics?: {
        inputBytes: number
        outputBytes: number
        durationMs: number
    }
}

export interface PipelineToolAdapter<Input = string, Output = string> {
    toolKey: string
    slug: string
    version: number
    inputKind: PipelineValueKind
    outputKind: PipelineValueKind
    safeForSensitiveInput: boolean
    deterministic: boolean
    mayIncreaseSize: boolean
    warnings: readonly string[]
    defaultOptions: Record<string, unknown>
    publicOptionKeys: readonly string[]
    persistentOptionKeys?: readonly string[]
    persistentOptionReview?: Record<string, string>
    validateOptions(options: Record<string, unknown>): AdapterValidationResult
    run(input: Input, options: Record<string, unknown>): Promise<AdapterRunResult<Output>> | AdapterRunResult<Output>
}

export interface PipelineStepExecution {
    stepId: string
    toolKey: string
    ok: boolean
    inputBytes: number
    outputBytes: number
    durationMs: number
    input?: string
    output?: string
    warnings: string[]
    error?: {
        code: string
        message: string
    }
}

export interface PipelineExecutionResult {
    ok: boolean
    finalOutput: string
    steps: PipelineStepExecution[]
    errors: string[]
    warnings: string[]
}

export interface RecipeValidationResult {
    ok: boolean
    errors: string[]
}

export function mergeRecipeSettings(settings?: Partial<RecipeSettings>): RecipeSettings {
    const maxInputBytes = Number(settings?.maxInputBytes)
    const maxOutputBytes = Number(settings?.maxOutputBytes)
    const maxSteps = Number(settings?.maxSteps)

    return {
        stopOnError: typeof settings?.stopOnError === "boolean" ? settings.stopOnError : DEFAULT_RECIPE_SETTINGS.stopOnError,
        keepIntermediateOutputs: typeof settings?.keepIntermediateOutputs === "boolean"
            ? settings.keepIntermediateOutputs
            : DEFAULT_RECIPE_SETTINGS.keepIntermediateOutputs,
        maxInputBytes: Number.isFinite(maxInputBytes) && maxInputBytes > 0
            ? Math.min(maxInputBytes, DEFAULT_RECIPE_SETTINGS.maxInputBytes)
            : DEFAULT_RECIPE_SETTINGS.maxInputBytes,
        maxOutputBytes: Number.isFinite(maxOutputBytes) && maxOutputBytes > 0
            ? Math.min(maxOutputBytes, DEFAULT_RECIPE_SETTINGS.maxOutputBytes)
            : DEFAULT_RECIPE_SETTINGS.maxOutputBytes,
        maxSteps: Number.isFinite(maxSteps) && maxSteps > 0
            ? Math.min(Math.floor(maxSteps), DEFAULT_RECIPE_SETTINGS.maxSteps)
            : DEFAULT_RECIPE_SETTINGS.maxSteps,
    }
}
