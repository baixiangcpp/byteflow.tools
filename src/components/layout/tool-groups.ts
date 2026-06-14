import { CLIENT_MENU_GROUPS } from "@/generated/client-tool-lookup"

export const toolGroups = CLIENT_MENU_GROUPS.map((group) => ({
    key: group.key,
    navKey: group.navKey,
    hubSlug: group.hubSlug,
    items: group.items.map((tool) => ({
        key: tool.key,
        href: `/${tool.slug}`,
    })),
}))
