#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadOrderedToolManifests } from "../lib/tool-manifest-lib.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "../..")
const MENU_GROUPS_PATH = path.join(ROOT, "src/core/registry/menu-groups.ts")
const OUTPUT_PATH = path.join(ROOT, "src/generated/client-tool-lookup.ts")
const TOOL_INDEX_PATH = path.join(ROOT, "src/generated/tool-index.json")

const MENU_GROUP_DEF_RE = /{ key: "([^"]+)", navKey: "([^"]+)", slug: "([^"]+)", descriptionKey: "([^"]+)" }/g
const FAMILY_GROUP_RE = /^\s*"([^"]+)":\s*"([^"]+)",?\s*$/gm
const FAMILY_BY_TOOL_KEY = {
    ai_color_palette_generator: "images-media",
    asn1_der_inspector: "security-tokens",
    barcode_generator: "generators",
    base_encoding_converter: "encoders-decoders",
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

function parseMenuGroups() {
    const source = fs.readFileSync(MENU_GROUPS_PATH, "utf8")
    const defsBlock = source.match(/export const MENU_GROUP_DEFS:[\s\S]*?=\s*\[([\s\S]*?)\]/)
    if (!defsBlock) {
        throw new Error("Unable to parse MENU_GROUP_DEFS from src/core/registry/menu-groups.ts")
    }

    const defs = [...defsBlock[1].matchAll(MENU_GROUP_DEF_RE)].map((match) => ({
        key: match[1],
        navKey: match[2],
        slug: match[3],
    }))

    const familyBlock = source.match(/const PRIMARY_GROUP_BY_FAMILY:[\s\S]*?=\s*{([\s\S]*?)}/)
    if (!familyBlock) {
        throw new Error("Unable to parse PRIMARY_GROUP_BY_FAMILY from src/core/registry/menu-groups.ts")
    }

    const primaryGroupByFamily = Object.fromEntries(
        [...familyBlock[1].matchAll(FAMILY_GROUP_RE)].map((match) => [match[1], match[2]]),
    )

    return { defs, primaryGroupByFamily }
}

function classifyToolToMenuGroup(tool, primaryGroupByFamily) {
    const taxonomy = getToolTaxonomy(tool)
    const familyGroup = primaryGroupByFamily[taxonomy.family]
    if (familyGroup) return familyGroup

    if (tool.category === "network-web") return "web_api_network"
    if (tool.category === "formatters") return "data_code_formats"
    if (tool.category === "generators") return "generators_calculators"
    return "text_regex"
}

function fallbackFamily(tool) {
    if (tool.category === "formatters") return "formatters-validators"
    if (tool.category === "generators") return "generators"
    if (tool.category === "network-web") return "network-http"
    return "text-strings"
}

function inferKeywordTags(tool) {
    const source = [tool.key, tool.slug, ...tool.keywords, ...(tool.searchKeywords || [])].join(" ").toLowerCase()
    const tags = new Set()
    const addWhen = (tag, patterns) => {
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

function uniqueSorted(values) {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

function getToolTaxonomy(tool) {
    const networkAccess = tool.networkAccess || "none"
    const family = FAMILY_BY_TOOL_KEY[tool.key] || fallbackFamily(tool)
    const tags = uniqueSorted([family, ...inferKeywordTags(tool)])
    const capabilities = ["browser-local", "offline-capable"]

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

function loadAliases() {
    if (!fs.existsSync(TOOL_INDEX_PATH)) return new Map()
    const index = JSON.parse(fs.readFileSync(TOOL_INDEX_PATH, "utf8"))
    return new Map(index.canonicalTools.map((t) => [t.key, t.aliases || []]))
}

function buildClientLookupSource() {
    const orderedTools = loadOrderedToolManifests()
    const aliasesByKey = loadAliases()

    const byKey = Object.fromEntries(
        orderedTools.map((tool) => {
            const taxonomy = getToolTaxonomy(tool)
            const entry = {
                key: tool.key,
                slug: tool.slug,
                keywords: tool.keywords,
                aliases: aliasesByKey.get(tool.key) || [],
                relatedToolKeys: tool.relatedTools,
                networkAccess: tool.networkAccess || "none",
                persistInput: tool.persistInput ?? null,
                family: taxonomy.family,
                tags: taxonomy.tags,
                capabilities: taxonomy.capabilities,
            }
            if (tool.searchKeywords) {
                entry.searchKeywords = tool.searchKeywords
            }
            return [tool.key, entry]
        }),
    )

    const bySlug = Object.fromEntries(orderedTools.map((tool) => [tool.slug, tool.key]))
    const { defs, primaryGroupByFamily } = parseMenuGroups()
    const menuGroups = defs.map((group) => ({
        key: group.key,
        navKey: group.navKey,
        hubSlug: group.slug,
        items: orderedTools
            .filter((tool) => classifyToolToMenuGroup(tool, primaryGroupByFamily) === group.key)
            .map((tool) => ({ key: tool.key, slug: tool.slug })),
    }))

    return `/**
 * Generated by scripts/generators/generate-client-tool-lookup.js
 * Do not edit manually.
 */

export type ClientToolLookupEntry = {
    key: string
    slug: string
    keywords: readonly string[]
    aliases: readonly string[]
    relatedToolKeys: readonly string[]
    networkAccess: "none" | "user_requested" | "third_party_api"
    persistInput: true | false | "opt-in" | null
    family: string
    tags: readonly string[]
    capabilities: readonly string[]
    searchKeywords?: readonly string[]
}

export type ClientMenuGroup = {
    key: string
    navKey: string
    hubSlug: string
    items: ReadonlyArray<{ key: string; slug: string }>
}

const CLIENT_TOOL_LOOKUP: Record<string, ClientToolLookupEntry> = ${JSON.stringify(byKey, null, 4)}

const CLIENT_TOOL_KEY_BY_SLUG: Record<string, string> = ${JSON.stringify(bySlug, null, 4)}

export const CLIENT_MENU_GROUPS: ReadonlyArray<ClientMenuGroup> = ${JSON.stringify(menuGroups, null, 4)}

export function getClientToolByKey(key: string): ClientToolLookupEntry | undefined {
    return CLIENT_TOOL_LOOKUP[key]
}

export function getClientToolBySlug(slug: string): ClientToolLookupEntry | undefined {
    const key = CLIENT_TOOL_KEY_BY_SLUG[slug]
    return key ? CLIENT_TOOL_LOOKUP[key] : undefined
}

export function getClientRelatedTools(toolKey: string): ClientToolLookupEntry[] {
    const tool = CLIENT_TOOL_LOOKUP[toolKey]
    if (!tool) return []

    return tool.relatedToolKeys
        .map((key) => CLIENT_TOOL_LOOKUP[key])
        .filter((entry): entry is ClientToolLookupEntry => Boolean(entry))
}
`
}

const nextOutput = `${buildClientLookupSource().trim()}\n`

if (process.argv.includes("--check")) {
    const currentOutput = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, "utf8") : ""
    if (currentOutput !== nextOutput) {
        console.error("[check:client-tool-lookup] Found stale src/generated/client-tool-lookup.ts. Run `npm run generate:client-tool-lookup`.")
        process.exit(1)
    }

    console.log("[check:client-tool-lookup] OK: lightweight client tool lookup is up to date.")
    process.exit(0)
}

fs.writeFileSync(OUTPUT_PATH, nextOutput)
console.log("[generate:client-tool-lookup] OK: refreshed src/generated/client-tool-lookup.ts")
