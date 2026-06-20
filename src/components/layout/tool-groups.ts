import { DISCOVERY_MENU_GROUPS } from "@/generated/discovery-tool-index"

export const toolGroups = DISCOVERY_MENU_GROUPS.map((group) => ({
    key: group.key,
    navKey: group.navKey,
    hubSlug: group.hubSlug,
    items: group.items.map((tool) => ({
        key: tool.key,
        href: `/${tool.slug}`,
    })),
}))
