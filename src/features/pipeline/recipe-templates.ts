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
    inputTypeKey: string
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
        inputTypeKey: "recipe_input_json",
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
        inputTypeKey: "recipe_input_url_encoded_json",
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
        inputTypeKey: "recipe_input_jwt",
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
        categoryKey: "recipe_category_logs",
        difficultyKey: "recipe_difficulty_medium",
        inputTypeKey: "recipe_input_logs",
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
        inputTypeKey: "recipe_input_text",
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
    {
        id: "json_typescript_contract_review",
        titleKey: "template_json_typescript_contract_review_title",
        descriptionKey: "template_json_typescript_contract_review_description",
        categoryKey: "recipe_category_schema",
        difficultyKey: "recipe_difficulty_medium",
        inputTypeKey: "recipe_input_json",
        privacyBoundaryKey: "recipe_privacy_structure_only",
        tags: ["json", "typescript", "contract", "schema"],
        workflowSlug: "json-typescript-contract-review",
        sampleInput: '{ "id": "evt_001", "type": "user.created", "payload": { "email": "alice@example.com", "active": true } }',
        steps: [
            {
                toolKey: "json_formatter",
                labelKey: "template_step_pretty_json",
                options: { mode: "pretty", indent: 2 },
            },
            {
                toolKey: "json_to_typescript",
                labelKey: "template_step_generate_typescript_interfaces",
                options: { rootName: "ApiEvent", readonly: true, optional: false },
            },
        ],
    },
    {
        id: "image_resize_social_export",
        titleKey: "template_image_resize_social_export_title",
        descriptionKey: "template_image_resize_social_export_description",
        categoryKey: "recipe_category_image",
        difficultyKey: "recipe_difficulty_easy",
        inputTypeKey: "recipe_input_manifest",
        privacyBoundaryKey: "recipe_privacy_structure_only",
        tags: ["image", "social", "export", "checksum"],
        workflowSlug: "image-resize-social-export",
        sampleInput: "asset: hero-card.png\nsize: 1200x630\nformat: webp\nquality: 0.9\nrights: owned-or-approved",
        steps: [
            {
                toolKey: "multiple_whitespace_remover",
                labelKey: "template_step_normalize_export_manifest",
                options: {},
            },
            {
                toolKey: "hash_generator",
                labelKey: "template_step_generate_manifest_checksum",
                options: { algorithm: "sha256" },
            },
        ],
    },
    {
        id: "yaml_config_to_json_review",
        titleKey: "template_yaml_config_to_json_review_title",
        descriptionKey: "template_yaml_config_to_json_review_description",
        categoryKey: "recipe_category_schema",
        difficultyKey: "recipe_difficulty_easy",
        inputTypeKey: "recipe_input_yaml",
        privacyBoundaryKey: "recipe_privacy_structure_only",
        tags: ["yaml", "json", "config", "schema"],
        sampleInput: "service: api\nreplicas: 2\nfeatures:\n  audit: true\n  beta: false\n",
        steps: [
            {
                toolKey: "yaml_json_converter",
                labelKey: "template_step_yaml_to_json",
                options: { mode: "yaml-to-json" },
            },
            {
                toolKey: "json_formatter",
                labelKey: "template_step_pretty_json",
                options: { mode: "pretty", indent: 2 },
            },
        ],
    },
    {
        id: "csv_fixture_to_json_contract",
        titleKey: "template_csv_fixture_to_json_contract_title",
        descriptionKey: "template_csv_fixture_to_json_contract_description",
        categoryKey: "recipe_category_schema",
        difficultyKey: "recipe_difficulty_easy",
        inputTypeKey: "recipe_input_csv",
        privacyBoundaryKey: "recipe_privacy_structure_only",
        tags: ["csv", "json", "fixture", "contract"],
        sampleInput: "id,email,active\n1,alice@example.com,true\n2,bob@example.com,false",
        steps: [
            {
                toolKey: "csv_json_converter",
                labelKey: "template_step_csv_to_json",
                options: { direction: "csv-to-json", delimiter: "auto", hasHeader: true, typeInference: true },
            },
            {
                toolKey: "json_formatter",
                labelKey: "template_step_pretty_json",
                options: { mode: "pretty", indent: 2 },
            },
        ],
    },
    {
        id: "ndjson_log_batch_review",
        titleKey: "template_ndjson_log_batch_review_title",
        descriptionKey: "template_ndjson_log_batch_review_description",
        categoryKey: "recipe_category_logs",
        difficultyKey: "recipe_difficulty_medium",
        inputTypeKey: "recipe_input_ndjson",
        privacyBoundaryKey: "recipe_privacy_structure_only",
        tags: ["ndjson", "logs", "json", "batch"],
        sampleInput: "{\"level\":\"warn\",\"message\":\"slow request\",\"duration_ms\":1200}\n{\"level\":\"error\",\"message\":\"timeout\",\"duration_ms\":3000}",
        steps: [
            {
                toolKey: "ndjson_formatter",
                labelKey: "template_step_ndjson_to_array",
                options: { mode: "to-array" },
            },
            {
                toolKey: "json_formatter",
                labelKey: "template_step_pretty_json",
                options: { mode: "pretty", indent: 2 },
            },
        ],
    },
    {
        id: "html_release_notes_markdown",
        titleKey: "template_html_release_notes_markdown_title",
        descriptionKey: "template_html_release_notes_markdown_description",
        categoryKey: "recipe_category_text",
        difficultyKey: "recipe_difficulty_easy",
        inputTypeKey: "recipe_input_html",
        privacyBoundaryKey: "recipe_privacy_structure_only",
        tags: ["html", "markdown", "release-notes", "content"],
        sampleInput: "<h2>Release notes</h2><ul><li>Added local exports</li><li>Fixed malformed input handling</li></ul>",
        steps: [
            {
                toolKey: "html_to_markdown",
                labelKey: "template_step_html_to_markdown",
                options: {},
            },
            {
                toolKey: "invisible_chars_detector",
                labelKey: "template_step_clean_invisible_chars",
                options: {
                    removeZeroWidth: true,
                    normalizeSpaces: true,
                    removeControlExceptNewlineTab: true,
                },
            },
        ],
    },
    {
        id: "openapi_change_review",
        titleKey: "template_openapi_change_review_title",
        descriptionKey: "template_openapi_change_review_description",
        categoryKey: "recipe_category_api",
        difficultyKey: "recipe_difficulty_medium",
        inputTypeKey: "recipe_input_openapi_pair",
        privacyBoundaryKey: "recipe_privacy_structure_only",
        tags: ["openapi", "api", "diff", "contract"],
        sampleInput: JSON.stringify({
            before: {
                openapi: "3.0.0",
                info: { title: "Billing API", version: "1.0.0" },
                paths: {
                    "/invoices": {
                        get: { responses: { "200": { description: "OK" } } },
                    },
                },
            },
            after: {
                openapi: "3.0.0",
                info: { title: "Billing API", version: "1.1.0" },
                paths: {
                    "/invoices": {
                        post: { responses: { "201": { description: "Created" } } },
                    },
                },
            },
        }, null, 2),
        steps: [
            {
                toolKey: "openapi_diff",
                labelKey: "template_step_compare_openapi_specs",
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
