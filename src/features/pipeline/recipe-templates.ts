import { getPipelineAdapter } from "./adapter-registry"
import { DEFAULT_RECIPE_SETTINGS, RECIPE_SCHEMA_VERSION, type RecipeDocument, type RecipeEdge, type RecipeStep } from "./recipe-types"

type TemplateStepDefinition = {
    toolKey: string
    labelKey: string
    options: Record<string, unknown>
}

export interface PipelineRecipeTemplate {
    id: string
    titleKey: string
    descriptionKey: string
    categoryKey: string
    difficultyKey: string
    privacyBoundaryKey: string
    tags: readonly string[]
    workflowSlug?: string
    sampleInput: string
    steps: readonly TemplateStepDefinition[]
}

export interface RecipeFromTemplateResult {
    recipe: RecipeDocument
    initialInput: string
}

export const PIPELINE_RECIPE_TEMPLATES = [
    {
        id: "api_payload_cleanup",
        titleKey: "template_api_payload_cleanup_title",
        descriptionKey: "template_api_payload_cleanup_description",
        categoryKey: "recipe_category_api",
        difficultyKey: "recipe_difficulty_easy",
        privacyBoundaryKey: "recipe_privacy_structure_only",
        tags: ["json", "api", "base64", "payload"],
        workflowSlug: "api-payload-cleanup",
        sampleInput: '{ "user": "alice@example.com", "role": "admin", "active": true }',
        steps: [
            {
                toolKey: "json_formatter",
                labelKey: "template_step_minify_json",
                options: { mode: "minify", indent: 2 },
            },
            {
                toolKey: "base64_encode_decode",
                labelKey: "template_step_base64url_encode",
                options: { operation: "encode", urlSafe: true },
            },
        ],
    },
    {
        id: "url_json_cleanup",
        titleKey: "template_url_json_cleanup_title",
        descriptionKey: "template_url_json_cleanup_description",
        categoryKey: "recipe_category_api",
        difficultyKey: "recipe_difficulty_easy",
        privacyBoundaryKey: "recipe_privacy_structure_only",
        tags: ["url", "json", "decode", "review"],
        sampleInput: "%7B%22user%22%3A%22alice%40example.com%22%2C%22active%22%3Atrue%7D",
        steps: [
            {
                toolKey: "url_encode_decode",
                labelKey: "template_step_url_decode",
                options: { operation: "decode", mode: "component" },
            },
            {
                toolKey: "json_formatter",
                labelKey: "template_step_pretty_json",
                options: { mode: "pretty", indent: 2 },
            },
        ],
    },
    {
        id: "security_token_review",
        titleKey: "template_security_token_review_title",
        descriptionKey: "template_security_token_review_description",
        categoryKey: "recipe_category_security",
        difficultyKey: "recipe_difficulty_medium",
        privacyBoundaryKey: "recipe_privacy_structure_only",
        tags: ["jwt", "token", "claims", "security"],
        workflowSlug: "security-token-review",
        sampleInput: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20iLCJleHAiOjE4OTM0NTYwMDAsInNjb3BlIjoicmVhZDpsb2dzIn0.signature-placeholder",
        steps: [
            {
                toolKey: "jwt_decoder",
                labelKey: "template_step_decode_jwt_payload",
                options: { part: "payload" },
            },
            {
                toolKey: "json_formatter",
                labelKey: "template_step_pretty_json",
                options: { mode: "pretty", indent: 2 },
            },
        ],
    },
    {
        id: "log_scrub_before_sharing",
        titleKey: "template_log_scrub_before_sharing_title",
        descriptionKey: "template_log_scrub_before_sharing_description",
        categoryKey: "recipe_category_security",
        difficultyKey: "recipe_difficulty_medium",
        privacyBoundaryKey: "recipe_privacy_structure_only",
        tags: ["logs", "redaction", "secrets", "sharing"],
        workflowSlug: "log-scrub-before-sharing",
        sampleInput: "2026-06-10T12:00:00Z WARN user=alice@example.com ip=203.0.113.10 Authorization: Bearer sample-token-value-12345",
        steps: [
            {
                toolKey: "invisible_chars_detector",
                labelKey: "template_step_clean_invisible_chars",
                options: {
                    removeZeroWidth: true,
                    normalizeSpaces: true,
                    removeControlExceptNewlineTab: true,
                },
            },
            {
                toolKey: "log_scrubber",
                labelKey: "template_step_scrub_log_secrets",
                options: {},
            },
        ],
    },
    {
        id: "clean_copied_config",
        titleKey: "template_clean_copied_config_title",
        descriptionKey: "template_clean_copied_config_description",
        categoryKey: "recipe_category_text",
        difficultyKey: "recipe_difficulty_easy",
        privacyBoundaryKey: "recipe_privacy_structure_only",
        tags: ["config", "invisible", "whitespace", "text"],
        sampleInput: "API_KEY\u200b=\u00a0sample_value\nNAME\u3000=\tByteflow",
        steps: [
            {
                toolKey: "invisible_chars_detector",
                labelKey: "template_step_clean_invisible_chars",
                options: {
                    removeZeroWidth: true,
                    normalizeSpaces: true,
                    removeControlExceptNewlineTab: true,
                },
            },
            {
                toolKey: "multiple_whitespace_remover",
                labelKey: "template_step_normalize_whitespace",
                options: {},
            },
        ],
    },
] as const satisfies readonly PipelineRecipeTemplate[]

export function getPipelineRecipeTemplate(templateId: string): PipelineRecipeTemplate | undefined {
    return PIPELINE_RECIPE_TEMPLATES.find((template) => template.id === templateId)
}

export function getPipelineRecipeTemplateForWorkflow(workflowSlug: string): PipelineRecipeTemplate | undefined {
    return PIPELINE_RECIPE_TEMPLATES.find(
        (template) => "workflowSlug" in template && template.workflowSlug === workflowSlug,
    )
}

export function createRecipeFromTemplate(
    template: PipelineRecipeTemplate,
    options: {
        recipeId: string
        now?: string
        createStepId: (index: number, toolKey: string) => string
        translate?: (key: string) => string
    },
): RecipeFromTemplateResult {
    const now = options.now ?? new Date().toISOString()
    const translate = options.translate ?? ((key: string) => key)
    const steps: RecipeStep[] = template.steps.map((step, index) => {
        const adapter = getPipelineAdapter(step.toolKey)
        if (!adapter) {
            throw new Error(`Missing pipeline adapter for template step: ${step.toolKey}`)
        }

        return {
            id: options.createStepId(index, step.toolKey),
            toolKey: adapter.toolKey,
            label: translate(step.labelKey),
            adapterVersion: adapter.version,
            inputMode: "previous_output",
            options: {
                ...adapter.defaultOptions,
                ...step.options,
            },
        }
    })
    const edges: RecipeEdge[] = steps.slice(0, -1).map((step, index) => ({
        fromStepId: step.id,
        toStepId: steps[index + 1].id,
    }))

    return {
        recipe: {
            schemaVersion: RECIPE_SCHEMA_VERSION,
            id: options.recipeId,
            name: translate(template.titleKey),
            description: translate(template.descriptionKey),
            createdAt: now,
            updatedAt: now,
            steps,
            edges,
            settings: { ...DEFAULT_RECIPE_SETTINGS },
        },
        initialInput: template.sampleInput,
    }
}
