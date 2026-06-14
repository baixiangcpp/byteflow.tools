import { TOOL_REGISTRY, type ToolMeta } from "@/core/registry"

export type MenuGroupKey =
    | "format_validate"
    | "convert_encode"
    | "text_content"
    | "web_api"
    | "generators_ids"
    | "design_media"

export type MenuGroupDef = {
    key: MenuGroupKey
    navKey: MenuGroupKey
    slug: string
    descriptionKey: `${MenuGroupKey}_desc`
}

export type MenuGroup = MenuGroupDef & {
    items: ToolMeta[]
}

export const MENU_GROUP_DEFS: MenuGroupDef[] = [
    { key: "format_validate", navKey: "format_validate", slug: "format-validate", descriptionKey: "format_validate_desc" },
    { key: "convert_encode", navKey: "convert_encode", slug: "convert-encode", descriptionKey: "convert_encode_desc" },
    { key: "text_content", navKey: "text_content", slug: "text-content", descriptionKey: "text_content_desc" },
    { key: "web_api", navKey: "web_api", slug: "web-api", descriptionKey: "web_api_desc" },
    { key: "generators_ids", navKey: "generators_ids", slug: "generators-ids", descriptionKey: "generators_ids_desc" },
    { key: "design_media", navKey: "design_media", slug: "design-media", descriptionKey: "design_media_desc" },
]

const OVERRIDE_GROUP_BY_TOOL_KEY: Record<string, MenuGroupKey> = {
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

function classifyToolToMenuGroup(tool: ToolMeta): MenuGroupKey {
    const overridden = OVERRIDE_GROUP_BY_TOOL_KEY[tool.key]
    if (overridden) return overridden

    if (tool.category === "network-web") return "web_api"
    if (tool.category === "formatters") return "format_validate"
    if (tool.category === "generators") return "generators_ids"
    return "text_content"
}

export function getMenuGroups(): MenuGroup[] {
    return MENU_GROUP_DEFS.map((group) => ({
        ...group,
        items: TOOL_REGISTRY.filter((tool) => classifyToolToMenuGroup(tool) === group.key),
    }))
}

export function getMenuGroupByKey(key: MenuGroupKey): MenuGroup | undefined {
    return getMenuGroups().find((group) => group.key === key)
}

export function getMenuGroupBySlug(slug: string): MenuGroup | undefined {
    return getMenuGroups().find((group) => group.slug === slug)
}

export const MENU_GROUP_HUB_SLUGS = MENU_GROUP_DEFS.map((group) => group.slug)
