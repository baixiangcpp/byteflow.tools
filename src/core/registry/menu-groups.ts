import { TOOL_REGISTRY, type ToolMeta } from "@/core/registry"

export type PrimaryMenuGroupKey =
    | "data_code_formats"
    | "encoding_crypto"
    | "web_api_network"
    | "devops_logs"
    | "text_regex"
    | "images_svg_css"
    | "generators_calculators"
    | "social_metadata"

export type LegacyMenuGroupKey =
    | "format_validate"
    | "convert_encode"
    | "text_content"
    | "web_api"
    | "generators_ids"
    | "design_media"

export type MenuGroupKey = PrimaryMenuGroupKey | LegacyMenuGroupKey

export type MenuGroupDef = {
    key: MenuGroupKey
    navKey: MenuGroupKey
    slug: string
    descriptionKey: `${MenuGroupKey}_desc`
}

export type PrimaryMenuGroupDef = MenuGroupDef & {
    key: PrimaryMenuGroupKey
    navKey: PrimaryMenuGroupKey
    descriptionKey: `${PrimaryMenuGroupKey}_desc`
}

export type LegacyMenuGroupDef = MenuGroupDef & {
    key: LegacyMenuGroupKey
    navKey: LegacyMenuGroupKey
    descriptionKey: `${LegacyMenuGroupKey}_desc`
}

export type MenuGroup = MenuGroupDef & {
    items: ToolMeta[]
}

export const MENU_GROUP_DEFS: PrimaryMenuGroupDef[] = [
    { key: "data_code_formats", navKey: "data_code_formats", slug: "data-code-formats", descriptionKey: "data_code_formats_desc" },
    { key: "encoding_crypto", navKey: "encoding_crypto", slug: "encoding-crypto", descriptionKey: "encoding_crypto_desc" },
    { key: "web_api_network", navKey: "web_api_network", slug: "web-api-network", descriptionKey: "web_api_network_desc" },
    { key: "devops_logs", navKey: "devops_logs", slug: "devops-logs", descriptionKey: "devops_logs_desc" },
    { key: "text_regex", navKey: "text_regex", slug: "text-regex", descriptionKey: "text_regex_desc" },
    { key: "images_svg_css", navKey: "images_svg_css", slug: "images-svg-css", descriptionKey: "images_svg_css_desc" },
    { key: "generators_calculators", navKey: "generators_calculators", slug: "generators-calculators", descriptionKey: "generators_calculators_desc" },
    { key: "social_metadata", navKey: "social_metadata", slug: "social-metadata", descriptionKey: "social_metadata_desc" },
]

export const LEGACY_MENU_GROUP_DEFS: LegacyMenuGroupDef[] = [
    { key: "format_validate", navKey: "format_validate", slug: "format-validate", descriptionKey: "format_validate_desc" },
    { key: "convert_encode", navKey: "convert_encode", slug: "convert-encode", descriptionKey: "convert_encode_desc" },
    { key: "text_content", navKey: "text_content", slug: "text-content", descriptionKey: "text_content_desc" },
    { key: "web_api", navKey: "web_api", slug: "web-api", descriptionKey: "web_api_desc" },
    { key: "generators_ids", navKey: "generators_ids", slug: "generators-ids", descriptionKey: "generators_ids_desc" },
    { key: "design_media", navKey: "design_media", slug: "design-media", descriptionKey: "design_media_desc" },
]

const PRIMARY_GROUP_BY_FAMILY: Record<NonNullable<ToolMeta["family"]>, PrimaryMenuGroupKey> = {
    "data-formats": "data_code_formats",
    "formatters-validators": "data_code_formats",
    "encoders-decoders": "encoding_crypto",
    "security-tokens": "encoding_crypto",
    "network-http": "web_api_network",
    "devops-logs": "devops_logs",
    "text-strings": "text_regex",
    "images-media": "images_svg_css",
    "svg-css-visual": "images_svg_css",
    generators: "generators_calculators",
    "workbench-pipeline": "devops_logs",
    "social-metadata": "social_metadata",
}

const LEGACY_OVERRIDE_GROUP_BY_TOOL_KEY: Record<string, LegacyMenuGroupKey> = {
    base_encoding_converter: "convert_encode",
    base64_encode_decode: "convert_encode",
    url_encode_decode: "convert_encode",
    image_base64: "convert_encode",
    html_encoder_decoder: "convert_encode",
    yaml_json_converter: "convert_encode",
    csv_json_converter: "convert_encode",
    json_to_typescript: "convert_encode",
    gzip_brotli_lab: "convert_encode",
    hex_bytes_workbench: "convert_encode",

    jwt_decoder: "web_api",
    jwt_workbench: "web_api",
    jwt_verifier: "web_api",
    hash_generator: "web_api",
    md5_generator: "web_api",
    openapi_viewer: "web_api",

    markdown_preview: "text_content",
    lorem_ipsum: "text_content",
    ascii_art_generator: "text_content",

    code_to_image_converter: "design_media",
    color_converter: "design_media",
    ai_color_palette_generator: "design_media",
    color_mixer: "design_media",
    color_shades_generator: "design_media",
    image_average_color_finder: "design_media",
    image_caption_generator: "design_media",
    image_color_extractor: "design_media",
    image_color_picker: "design_media",
    image_cropper: "design_media",
    image_filters: "design_media",
    instagram_filters: "design_media",
    instagram_post_generator: "design_media",
    instagram_story_generator: "design_media",
    open_graph_meta_generator: "design_media",
    tweet_generator: "design_media",
    tweet_to_image_converter: "design_media",
    twitter_ad_revenue_generator: "design_media",
    instagram_photo_downloader: "design_media",
    vimeo_thumbnail_grabber: "design_media",
    youtube_thumbnail_grabber: "design_media",
    image_resizer: "design_media",
    photo_censor: "design_media",
    scanned_pdf_converter: "design_media",
    svg_blob_generator: "design_media",
    svg_pattern_generator: "design_media",
    svg_stroke_to_fill_converter: "design_media",
    svg_to_png_converter: "design_media",
    css_background_pattern_generator: "design_media",
    css_border_radius_generator: "design_media",
    css_box_shadow_generator: "design_media",
    css_checkbox_generator: "design_media",
    css_clip_path_generator: "design_media",
    css_cubic_bezier_generator: "design_media",
    css_glassmorphism_generator: "design_media",
    css_gradient_generator: "design_media",
    css_loader_generator: "design_media",
    css_switch_generator: "design_media",
    css_text_glitch_effect_generator: "design_media",
    css_triangle_generator: "design_media",
    svg_optimizer: "design_media",
    qr_code_generator: "design_media",
    google_fonts_pair_finder: "design_media",
    text_to_handwriting_converter: "design_media",
    react_native_shadow_generator: "design_media",
}

function classifyToolToPrimaryMenuGroup(tool: ToolMeta): PrimaryMenuGroupKey {
    if (tool.family && PRIMARY_GROUP_BY_FAMILY[tool.family]) {
        return PRIMARY_GROUP_BY_FAMILY[tool.family]
    }

    if (tool.category === "network-web") return "web_api_network"
    if (tool.category === "formatters") return "data_code_formats"
    if (tool.category === "generators") return "generators_calculators"
    return "text_regex"
}

function classifyToolToLegacyMenuGroup(tool: ToolMeta): LegacyMenuGroupKey {
    const overridden = LEGACY_OVERRIDE_GROUP_BY_TOOL_KEY[tool.key]
    if (overridden) return overridden

    if (tool.category === "network-web") return "web_api"
    if (tool.category === "formatters") return "format_validate"
    if (tool.category === "generators") return "generators_ids"
    return "text_content"
}

function buildGroups(defs: MenuGroupDef[], classifier: (tool: ToolMeta) => MenuGroupKey): MenuGroup[] {
    return defs.map((group) => ({
        ...group,
        items: TOOL_REGISTRY.filter((tool) => classifier(tool) === group.key),
    }))
}

export function getMenuGroups(): MenuGroup[] {
    return buildGroups(MENU_GROUP_DEFS, classifyToolToPrimaryMenuGroup)
}

export function getAllMenuGroups(): MenuGroup[] {
    return [
        ...getMenuGroups(),
        ...buildGroups(LEGACY_MENU_GROUP_DEFS, classifyToolToLegacyMenuGroup),
    ]
}

export function getMenuGroupByKey(key: MenuGroupKey): MenuGroup | undefined {
    return getAllMenuGroups().find((group) => group.key === key)
}

export function getMenuGroupBySlug(slug: string): MenuGroup | undefined {
    return getAllMenuGroups().find((group) => group.slug === slug)
}

export const MENU_GROUP_HUB_SLUGS = MENU_GROUP_DEFS.map((group) => group.slug)
export const LEGACY_MENU_GROUP_HUB_SLUGS = LEGACY_MENU_GROUP_DEFS.map((group) => group.slug)
