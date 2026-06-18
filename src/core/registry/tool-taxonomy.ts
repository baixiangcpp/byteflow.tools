import type { ToolMeta, ToolNetworkAccess } from "./types"

export type ToolFamily =
    | "formatters-validators"
    | "encoders-decoders"
    | "text-strings"
    | "data-formats"
    | "security-tokens"
    | "network-http"
    | "devops-logs"
    | "generators"
    | "images-media"
    | "svg-css-visual"
    | "social-metadata"
    | "workbench-pipeline"

export type ToolCapability =
    | "browser-local"
    | "offline-capable"
    | "external-request"
    | "sensitive-input"
    | "pipeline-ready"
    | "file-input"
    | "visual-output"

export type ToolTaxonomy = {
    family: ToolFamily
    tags: string[]
    capabilities: ToolCapability[]
}

export const TOOL_FAMILY_LABELS: Record<ToolFamily, string> = {
    "formatters-validators": "Formatters and validators",
    "encoders-decoders": "Encoders and decoders",
    "text-strings": "Text and strings",
    "data-formats": "JSON, YAML, CSV, and data formats",
    "security-tokens": "Security, tokens, and certificates",
    "network-http": "Network, HTTP, and web",
    "devops-logs": "DevOps and logs",
    generators: "Generators",
    "images-media": "Images and media",
    "svg-css-visual": "SVG and CSS visual tools",
    "social-metadata": "Social and metadata tools",
    "workbench-pipeline": "Workbench and pipeline tools",
}

export const TOOL_CAPABILITY_LABELS: Record<ToolCapability, string> = {
    "browser-local": "Browser-local",
    "offline-capable": "Offline capable",
    "external-request": "External request",
    "sensitive-input": "Sensitive input",
    "pipeline-ready": "Pipeline ready",
    "file-input": "File input",
    "visual-output": "Visual output",
}

const FAMILY_BY_TOOL_KEY: Partial<Record<string, ToolFamily>> = {
    ai_color_palette_generator: "images-media",
    asn1_der_inspector: "security-tokens",
    barcode_generator: "generators",
    base64_encode_decode: "encoders-decoders",
    certificate_decoder: "security-tokens",
    chmod_calculator: "devops-logs",
    cidr_subnet_calculator: "network-http",
    code_to_image_converter: "images-media",
    color_converter: "svg-css-visual",
    color_mixer: "svg-css-visual",
    color_shades_generator: "svg-css-visual",
    cron_visualizer: "devops-logs",
    crontab_generator: "devops-logs",
    css_background_pattern_generator: "svg-css-visual",
    css_border_radius_generator: "svg-css-visual",
    css_box_shadow_generator: "svg-css-visual",
    css_checkbox_generator: "svg-css-visual",
    css_clip_path_generator: "svg-css-visual",
    css_cubic_bezier_generator: "svg-css-visual",
    css_glassmorphism_generator: "svg-css-visual",
    css_gradient_generator: "svg-css-visual",
    css_loader_generator: "svg-css-visual",
    css_switch_generator: "svg-css-visual",
    css_text_glitch_effect_generator: "svg-css-visual",
    css_triangle_generator: "svg-css-visual",
    csp_parser: "security-tokens",
    csv_diff: "data-formats",
    csv_json_converter: "data-formats",
    curl_to_code: "network-http",
    docker_run_to_compose: "devops-logs",
    env_parser: "devops-logs",
    fake_iban_generator: "generators",
    google_fonts_pair_finder: "svg-css-visual",
    gzip_brotli_lab: "encoders-decoders",
    har_viewer_sanitizer: "network-http",
    hash_generator: "security-tokens",
    header_diff: "network-http",
    hex_bytes_workbench: "encoders-decoders",
    html_encoder_decoder: "encoders-decoders",
    html_to_markdown: "text-strings",
    http_request_builder: "network-http",
    http_status_codes: "network-http",
    id_generator: "generators",
    image_average_color_finder: "images-media",
    image_base64: "encoders-decoders",
    image_caption_generator: "images-media",
    image_color_extractor: "images-media",
    image_color_picker: "images-media",
    image_cropper: "images-media",
    image_filters: "images-media",
    image_resizer: "images-media",
    instagram_filters: "social-metadata",
    instagram_photo_downloader: "social-metadata",
    instagram_post_generator: "social-metadata",
    instagram_story_generator: "social-metadata",
    invisible_chars_detector: "text-strings",
    jq_playground: "data-formats",
    json_diff_viewer: "data-formats",
    json_formatter: "data-formats",
    json_to_typescript: "data-formats",
    jsonpath_playground: "data-formats",
    jwt_decoder: "security-tokens",
    jwt_verifier: "security-tokens",
    jwt_workbench: "security-tokens",
    list_randomizer: "generators",
    local_log_parser: "devops-logs",
    log_scrubber: "devops-logs",
    markdown_preview: "text-strings",
    md5_generator: "security-tokens",
    ndjson_formatter: "data-formats",
    open_graph_meta_generator: "social-metadata",
    openapi_mock: "network-http",
    openapi_viewer: "network-http",
    password_generator: "generators",
    photo_censor: "images-media",
    pipeline_builder: "workbench-pipeline",
    qr_code_generator: "generators",
    react_native_shadow_generator: "svg-css-visual",
    regex_generator: "text-strings",
    regex_tester: "text-strings",
    robots_txt_tester: "network-http",
    saml_decoder: "security-tokens",
    scanned_pdf_converter: "images-media",
    security_header_analyzer: "security-tokens",
    slugify_case_converter: "text-strings",
    structured_data_visualizer: "data-formats",
    svg_blob_generator: "svg-css-visual",
    svg_optimizer: "svg-css-visual",
    svg_pattern_generator: "svg-css-visual",
    svg_stroke_to_fill_converter: "svg-css-visual",
    svg_to_png_converter: "svg-css-visual",
    text_diff_checker: "text-strings",
    text_to_handwriting_converter: "images-media",
    totp_generator: "security-tokens",
    tweet_generator: "social-metadata",
    tweet_to_image_converter: "social-metadata",
    twitter_ad_revenue_generator: "social-metadata",
    unicode_inspector: "text-strings",
    unix_timestamp: "generators",
    url_encode_decode: "encoders-decoders",
    url_parser: "network-http",
    user_agent_parser: "network-http",
    uuid_generator: "generators",
    vimeo_thumbnail_grabber: "social-metadata",
    yaml_json_converter: "data-formats",
    yaml_merge_patch_explorer: "data-formats",
    youtube_thumbnail_grabber: "social-metadata",
    yq_playground: "data-formats",
}

const PIPELINE_READY_TOOL_KEYS = new Set([
    "base64_encode_decode",
    "csv_json_converter",
    "env_parser",
    "hash_generator",
    "html_to_markdown",
    "invisible_chars_detector",
    "json_formatter",
    "jwt_decoder",
    "log_scrubber",
    "multiple_whitespace_remover",
    "ndjson_formatter",
    "regex_tester",
    "slugify_case_converter",
    "unix_timestamp",
    "url_encode_decode",
    "yaml_json_converter",
])

function fallbackFamily(tool: ToolMeta): ToolFamily {
    if (tool.category === "formatters") return "formatters-validators"
    if (tool.category === "generators") return "generators"
    if (tool.category === "network-web") return "network-http"
    return "text-strings"
}

function inferKeywordTags(tool: ToolMeta): string[] {
    const source = [tool.key, tool.slug, ...tool.keywords, ...(tool.searchKeywords ?? [])]
        .join(" ")
        .toLowerCase()

    const tags = new Set<string>()
    const addWhen = (tag: string, patterns: string[]) => {
        if (patterns.some((pattern) => source.includes(pattern))) tags.add(tag)
    }

    addWhen("json", ["json", "jq"])
    addWhen("yaml", ["yaml", "yq"])
    addWhen("csv", ["csv"])
    addWhen("xml", ["xml", "saml"])
    addWhen("html", ["html"])
    addWhen("css", ["css"])
    addWhen("svg", ["svg"])
    addWhen("markdown", ["markdown"])
    addWhen("base64", ["base64"])
    addWhen("url", ["url", "uri"])
    addWhen("jwt", ["jwt"])
    addWhen("hash", ["hash", "checksum", "digest", "md5", "sha"])
    addWhen("http", ["http", "header", "curl", "openapi", "request"])
    addWhen("regex", ["regex", "regexp"])
    addWhen("image", ["image", "photo", "png", "jpeg", "webp"])
    addWhen("color", ["color", "palette", "gradient"])
    addWhen("logs", ["log", "har"])
    addWhen("security", ["security", "token", "certificate", "totp", "secret", "saml", "asn.1", "asn1"])

    return [...tags].sort()
}

function uniqueSorted<T extends string>(values: T[]): T[] {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

export function getToolTaxonomy(tool: ToolMeta): ToolTaxonomy {
    const networkAccess: ToolNetworkAccess = tool.networkAccess ?? "none"
    const family = FAMILY_BY_TOOL_KEY[tool.key] ?? fallbackFamily(tool)
    const tags = uniqueSorted([family, ...inferKeywordTags(tool)])
    const capabilities: ToolCapability[] = ["browser-local", "offline-capable"]

    if (networkAccess !== "none") capabilities.push("external-request")
    if (tool.persistInput === false || family === "security-tokens" || family === "devops-logs") {
        capabilities.push("sensitive-input")
    }
    if (PIPELINE_READY_TOOL_KEYS.has(tool.key)) capabilities.push("pipeline-ready")
    if (["data-formats", "images-media", "devops-logs", "workbench-pipeline"].includes(family)) {
        capabilities.push("file-input")
    }
    if (["images-media", "svg-css-visual", "social-metadata"].includes(family)) {
        capabilities.push("visual-output")
    }

    return {
        family,
        tags,
        capabilities: uniqueSorted(capabilities),
    }
}
