import { TOOL_REGISTRY, type ToolMeta } from "@/core/registry"
import taxonomyConfig from "./tool-taxonomy-config.json"

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

export const MENU_GROUP_DEFS = taxonomyConfig.primaryMenuGroupDefs as PrimaryMenuGroupDef[]
export const LEGACY_MENU_GROUP_DEFS = taxonomyConfig.legacyMenuGroupDefs as LegacyMenuGroupDef[]

const PRIMARY_GROUP_BY_FAMILY = taxonomyConfig.primaryGroupByFamily as Record<NonNullable<ToolMeta["family"]>, PrimaryMenuGroupKey>
const LEGACY_OVERRIDE_GROUP_BY_TOOL_KEY = taxonomyConfig.legacyOverrideGroupByToolKey as Record<string, LegacyMenuGroupKey>

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
