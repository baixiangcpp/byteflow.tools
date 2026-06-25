import { getPipelineAdapter } from "./adapter-registry"
import {
    DEFAULT_RECIPE_SETTINGS,
    RECIPE_SCHEMA_VERSION,
    mergeRecipeSettings,
    type PipelineExecutionResult,
    type PipelineStepExecution,
    type PipelineToolAdapter,
    type RecipeDocument,
    type RecipeEdge,
    type RecipeStep,
    type RecipeValidationResult,
} from "./recipe-types"

const textEncoder = new TextEncoder()

function byteLength(value: string): number {
    return textEncoder.encode(value).byteLength
}

type AdapterResolver = (toolKey: string) => PipelineToolAdapter | undefined

const SUPPORTED_INPUT_MODES = ["previous_output", "constant"] as const

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
}

function getLinearSteps(recipe: RecipeDocument): RecipeStep[] {
    if (recipe.edges.length === 0) return recipe.steps

    const stepsById = new Map(recipe.steps.map((step) => [step.id, step]))
    const incoming = new Set(recipe.edges.map((edge) => edge.toStepId))
    const first = recipe.steps.find((step) => !incoming.has(step.id))
    if (!first) return recipe.steps

    const ordered: RecipeStep[] = []
    const visited = new Set<string>()
    let current: RecipeStep | undefined = first
    while (current && !visited.has(current.id)) {
        ordered.push(current)
        visited.add(current.id)
        const edge = recipe.edges.find((candidate) => candidate.fromStepId === current?.id)
        current = edge ? stepsById.get(edge.toStepId) : undefined
    }

    return ordered
}

function validateLinearEdges(steps: RecipeStep[], edges: RecipeEdge[]): string[] {
    if (edges.length === 0) return []

    const errors: string[] = []
    const stepIds = new Set(steps.map((step) => step.id))
    if (edges.length !== Math.max(0, steps.length - 1)) {
        errors.push("edges must form a single linear chain covering every step.")
    }

    const outgoing = new Map<string, string>()
    const incoming = new Map<string, string>()

    for (const edge of edges) {
        if (!stepIds.has(edge.fromStepId) || !stepIds.has(edge.toStepId)) continue
        if (edge.fromStepId === edge.toStepId) {
            errors.push(`Edge ${edge.fromStepId} -> ${edge.toStepId} is a self-loop.`)
            continue
        }
        if (outgoing.has(edge.fromStepId)) errors.push(`Step ${edge.fromStepId} has multiple outgoing edges.`)
        if (incoming.has(edge.toStepId)) errors.push(`Step ${edge.toStepId} has multiple incoming edges.`)
        outgoing.set(edge.fromStepId, edge.toStepId)
        incoming.set(edge.toStepId, edge.fromStepId)
    }

    const starts = steps.filter((step) => !incoming.has(step.id))
    const ends = steps.filter((step) => !outgoing.has(step.id))
    if (starts.length !== 1) errors.push("Linear recipe must have exactly one start step.")
    if (ends.length !== 1) errors.push("Linear recipe must have exactly one end step.")
    if (errors.length > 0) return errors

    const visited = new Set<string>()
    let current: string | undefined = starts[0]?.id
    while (current) {
        if (visited.has(current)) {
            errors.push("edges must not contain cycles.")
            break
        }
        visited.add(current)
        current = outgoing.get(current)
    }

    if (visited.size !== steps.length) {
        errors.push("edges must form one connected linear chain covering every step.")
    }

    return errors
}

export function validateRecipe(recipe: unknown, resolveAdapter: AdapterResolver = getPipelineAdapter): RecipeValidationResult {
    const errors: string[] = []
    try {
        if (!isPlainObject(recipe)) return { ok: false, errors: ["Recipe must be a plain object."] }

        if (recipe.schemaVersion !== RECIPE_SCHEMA_VERSION) errors.push(`schemaVersion must be ${RECIPE_SCHEMA_VERSION}.`)
        if (typeof recipe.id !== "string" || !recipe.id.trim()) errors.push("id is required.")
        if (typeof recipe.name !== "string" || !recipe.name.trim()) errors.push("name is required.")
        if (!Array.isArray(recipe.steps)) errors.push("steps must be an array.")
        if (!Array.isArray(recipe.edges)) errors.push("edges must be an array.")
        if (!Object.prototype.hasOwnProperty.call(recipe, "settings") || !isPlainObject(recipe.settings)) {
            errors.push("settings must be a plain object.")
        }
        if (errors.length > 0) return { ok: false, errors }

        const document = recipe as unknown as RecipeDocument
        const settings = mergeRecipeSettings(document.settings)
        if (document.steps.length > settings.maxSteps) errors.push(`Recipe has more than ${settings.maxSteps} steps.`)

        const stepIds = new Set<string>()
        const validSteps: RecipeStep[] = []
        for (const stepValue of document.steps) {
            if (!isPlainObject(stepValue)) {
                errors.push("Each step must be a plain object.")
                continue
            }
            const step = stepValue as Partial<RecipeStep>
            const stepId = typeof step.id === "string" ? step.id : ""
            const toolKey = typeof step.toolKey === "string" ? step.toolKey : ""
            const adapterVersion = step.adapterVersion
            const optionsProvided = Object.prototype.hasOwnProperty.call(step, "options")
            const options = optionsProvided ? step.options : {}

            if (!stepId.trim()) errors.push("Each step requires a non-empty string id.")
            if (stepId && stepIds.has(stepId)) errors.push(`Duplicate step id: ${stepId}.`)
            if (stepId) stepIds.add(stepId)
            if (!toolKey.trim()) errors.push(`${stepId || "(missing step id)"} requires a non-empty string toolKey.`)
            if (typeof adapterVersion !== "number" || !Number.isFinite(adapterVersion)) {
                errors.push(`${stepId || toolKey || "(missing step)"} requires a numeric adapterVersion.`)
            }
            if (typeof step.inputMode !== "string" || !SUPPORTED_INPUT_MODES.includes(step.inputMode as RecipeStep["inputMode"])) {
                errors.push(`${stepId || toolKey || "(missing step)"} has an unsupported inputMode.`)
            }
            if (optionsProvided && !isPlainObject(options)) {
                errors.push(`${stepId || toolKey || "(missing step)"} options must be a plain object.`)
            }

            const adapter = toolKey ? resolveAdapter(toolKey) : undefined
            if (!adapter) {
                errors.push(`No pipeline adapter is available for ${toolKey || "(missing toolKey)"}.`)
                continue
            }
            if (adapterVersion !== adapter.version) {
                errors.push(`${toolKey} requires adapter version ${adapter.version}.`)
            }
            if (!optionsProvided || isPlainObject(options)) {
                const optionsResult = adapter.validateOptions({ ...adapter.defaultOptions, ...(options as Record<string, unknown>) })
                if (!optionsResult.ok) {
                    errors.push(...optionsResult.errors.map((error) => `${stepId || toolKey}: ${error}`))
                }
            }

            if (
                stepId.trim() &&
                toolKey.trim() &&
                typeof adapterVersion === "number" &&
                Number.isFinite(adapterVersion) &&
                typeof step.inputMode === "string" &&
                SUPPORTED_INPUT_MODES.includes(step.inputMode as RecipeStep["inputMode"]) &&
                (!optionsProvided || isPlainObject(options))
            ) {
                validSteps.push({
                    id: stepId,
                    toolKey,
                    label: typeof step.label === "string" ? step.label : undefined,
                    adapterVersion,
                    inputMode: step.inputMode as RecipeStep["inputMode"],
                    constantInput: typeof step.constantInput === "string" ? step.constantInput : undefined,
                    options: isPlainObject(options) ? options : {},
                })
            }
        }

        const validEdges: RecipeEdge[] = []
        for (const edgeValue of document.edges) {
            if (!isPlainObject(edgeValue)) {
                errors.push("Each edge must be a plain object.")
                continue
            }
            const edge = edgeValue as Partial<RecipeEdge>
            const fromStepId = typeof edge.fromStepId === "string" ? edge.fromStepId : ""
            const toStepId = typeof edge.toStepId === "string" ? edge.toStepId : ""
            if (!fromStepId.trim()) errors.push("Each edge requires a non-empty string fromStepId.")
            if (!toStepId.trim()) errors.push("Each edge requires a non-empty string toStepId.")
            if (fromStepId && !stepIds.has(fromStepId)) errors.push(`Edge references unknown fromStepId: ${fromStepId}.`)
            if (toStepId && !stepIds.has(toStepId)) errors.push(`Edge references unknown toStepId: ${toStepId}.`)
            if (fromStepId.trim() && toStepId.trim() && stepIds.has(fromStepId) && stepIds.has(toStepId)) {
                validEdges.push({ fromStepId, toStepId })
            }
        }

        if (validSteps.length === document.steps.length && validEdges.length === document.edges.length) {
            errors.push(...validateLinearEdges(validSteps, validEdges))
        }

        return { ok: errors.length === 0, errors }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown validation error."
        return { ok: false, errors: [`Recipe validation failed: ${message}`] }
    }
}

export async function runRecipe(
    recipe: RecipeDocument,
    initialInput: string,
    resolveAdapter: AdapterResolver = getPipelineAdapter,
): Promise<PipelineExecutionResult> {
    const validation = validateRecipe(recipe, resolveAdapter)
    if (!validation.ok) {
        return {
            ok: false,
            finalOutput: initialInput,
            steps: [],
            errors: validation.errors,
            warnings: [],
        }
    }

    const settings = mergeRecipeSettings(recipe.settings)
    if (byteLength(initialInput) > settings.maxInputBytes) {
        return {
            ok: false,
            finalOutput: initialInput,
            steps: [],
            errors: [`Initial input exceeds ${settings.maxInputBytes} bytes.`],
            warnings: [],
        }
    }

    const executions: PipelineStepExecution[] = []
    const warnings: string[] = []
    const errors: string[] = []
    let currentInput = initialInput

    for (const step of getLinearSteps(recipe)) {
        const adapter = resolveAdapter(step.toolKey)!
        const stepInput = step.inputMode === "constant" ? (step.constantInput ?? "") : currentInput
        const options = { ...adapter.defaultOptions, ...(step.options || {}) }
        const startedAt = performance.now()

        if (byteLength(stepInput) > settings.maxInputBytes) {
            const error = `Step ${step.id} input exceeds ${settings.maxInputBytes} bytes.`
            const execution: PipelineStepExecution = {
                stepId: step.id,
                toolKey: step.toolKey,
                ok: false,
                inputBytes: byteLength(stepInput),
                outputBytes: 0,
                durationMs: Math.max(0, performance.now() - startedAt),
                warnings: [],
                error: { code: "input_too_large", message: error },
            }
            if (settings.keepIntermediateOutputs) {
                execution.input = stepInput
            }
            executions.push(execution)
            errors.push(error)
            if (settings.stopOnError) break
            continue
        }

        let result
        try {
            result = await adapter.run(stepInput, options)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Adapter threw an unknown runtime error."
            const execution: PipelineStepExecution = {
                stepId: step.id,
                toolKey: step.toolKey,
                ok: false,
                inputBytes: byteLength(stepInput),
                outputBytes: 0,
                durationMs: Math.max(0, performance.now() - startedAt),
                warnings: [],
                error: { code: "adapter_runtime_error", message },
            }
            if (settings.keepIntermediateOutputs) {
                execution.input = stepInput
            }
            executions.push(execution)
            errors.push(`${step.id}: ${message}`)
            if (settings.stopOnError) break
            continue
        }
        const output = typeof result.output === "string" ? result.output : ""
        const outputBytes = byteLength(output)
        const stepWarnings = result.warnings || []
        warnings.push(...stepWarnings.map((warning) => `${step.id}: ${warning}`))

        if (result.ok && outputBytes > settings.maxOutputBytes) {
            const error = `Step ${step.id} output exceeds ${settings.maxOutputBytes} bytes.`
            const execution: PipelineStepExecution = {
                stepId: step.id,
                toolKey: step.toolKey,
                ok: false,
                inputBytes: byteLength(stepInput),
                outputBytes,
                durationMs: result.metrics?.durationMs ?? Math.max(0, performance.now() - startedAt),
                warnings: stepWarnings,
                error: { code: "output_too_large", message: error },
            }
            if (settings.keepIntermediateOutputs) {
                execution.input = stepInput
                execution.output = output
            }
            executions.push(execution)
            errors.push(error)
            if (settings.stopOnError) break
            continue
        }

        const execution: PipelineStepExecution = {
            stepId: step.id,
            toolKey: step.toolKey,
            ok: result.ok,
            inputBytes: result.metrics?.inputBytes ?? byteLength(stepInput),
            outputBytes: result.metrics?.outputBytes ?? outputBytes,
            durationMs: result.metrics?.durationMs ?? Math.max(0, performance.now() - startedAt),
            warnings: stepWarnings,
            error: result.error,
        }
        if (settings.keepIntermediateOutputs) {
            execution.input = stepInput
            execution.output = output
        }
        executions.push(execution)

        if (!result.ok) {
            const error = result.error?.message || `Step ${step.id} failed.`
            errors.push(`${step.id}: ${error}`)
            if (settings.stopOnError) break
            continue
        }

        currentInput = output
    }

    return {
        ok: errors.length === 0,
        finalOutput: currentInput,
        steps: executions,
        errors,
        warnings,
    }
}

export function createEmptyRecipe(id: string, name: string): RecipeDocument {
    const now = new Date().toISOString()
    return {
        schemaVersion: RECIPE_SCHEMA_VERSION,
        id,
        name,
        createdAt: now,
        updatedAt: now,
        steps: [],
        edges: [],
        settings: { ...DEFAULT_RECIPE_SETTINGS },
    }
}
