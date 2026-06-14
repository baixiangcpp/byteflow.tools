"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { cn } from "@/core/utils/utils"
import { useLang } from "@/core/i18n/lang-provider"
import { toolGroups } from "@/components/layout/tool-groups"

import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion"

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname()
    const { lang, t } = useLang()

    const activeGroup = toolGroups.find((group) =>
        group.items.some((item) => pathname === `/${lang}${item.href}`)
    )?.key

    return (
        <nav className={cn("h-full overflow-y-auto py-2", className)}>
            <div className="flex-1 overflow-y-auto">
                <Accordion type="single" collapsible defaultValue={activeGroup} className="w-full">
                    {toolGroups.map((group) => {
                        const translatedTitle = requireTranslationValue(t.nav[group.navKey], `nav.${group.navKey}`)

                        return (
                            <AccordionItem key={group.key} value={group.key} className="border-b-0">
                                <AccordionTrigger className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
                                    {translatedTitle}
                                </AccordionTrigger>
                                <AccordionContent className="pb-1">
                                    <div className="flex flex-col">
                                        {group.items.map((item) => {
                                            const fullHref = `/${lang}${item.href}`
                                            const isActive = pathname === fullHref
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={fullHref}
                                                    className={cn(
                                                        "flex items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                                                        isActive
                                                            ? "bg-primary/10 font-medium text-primary"
                                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    )}
                                                >
                                                    {requireTranslationValue(t.tools[item.key]?.title, `tools.${item.key}.title`)}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </div>
        </nav>
    )
}
