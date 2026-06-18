"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useLang } from "@/core/i18n/lang-provider"
import { cn } from "@/core/utils/utils"

type PageLink = {
    slug: "about" | "contact"
    key: "about_title" | "contact_title"
}

const CATEGORY_LINKS = [
    { slug: "data-code-formats", key: "data_code_formats" },
    { slug: "encoding-crypto", key: "encoding_crypto" },
    { slug: "web-api-network", key: "web_api_network" },
    { slug: "devops-logs", key: "devops_logs" },
    { slug: "text-regex", key: "text_regex" },
    { slug: "images-svg-css", key: "images_svg_css" },
    { slug: "generators-calculators", key: "generators_calculators" },
    { slug: "social-metadata", key: "social_metadata" },
] as const

const PAGE_LINKS: PageLink[] = [
    { slug: "about", key: "about_title" },
    { slug: "contact", key: "contact_title" },
]

export function NavbarMobileMenu({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const pathname = usePathname()
    const { lang, t } = useLang()

    const getCategoryHref = React.useCallback((slug: string) => `/${lang}/${slug}`, [lang])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="top"
                className="overscroll-y-contain border-border/70 bg-popover/95 px-2 pb-6 pt-11 backdrop-blur-xl"
                showCloseButton
            >
                <SheetTitle className="sr-only">{t.nav.navigation}</SheetTitle>
                <div className="grid grid-cols-2 gap-2 px-1">
                    {CATEGORY_LINKS.map((cat) => {
                        const href = getCategoryHref(cat.slug)
                        return (
                            <SheetClose asChild key={cat.slug}>
                                <Link
                                    href={href}
                                    prefetch={false}
                                    aria-current={pathname === href ? "page" : undefined}
                                    className={cn(
                                        "rounded-lg border px-3 py-2 text-sm",
                                        pathname === href
                                            ? "border-primary/35 bg-primary/12 text-primary"
                                            : "border-border/70 text-foreground/90 hover:bg-muted"
                                    )}
                                >
                                    {t.nav[cat.key]}
                                </Link>
                            </SheetClose>
                        )
                    })}
                    {PAGE_LINKS.map((page) => {
                        const href = `/${lang}/${page.slug}`
                        return (
                            <SheetClose asChild key={page.slug}>
                                <Link
                                    href={href}
                                    prefetch={false}
                                    aria-current={pathname === href ? "page" : undefined}
                                    className={cn(
                                        "rounded-lg border px-3 py-2 text-sm",
                                        pathname === href
                                            ? "border-primary/35 bg-primary/12 text-primary"
                                            : "border-border/70 text-foreground/90 hover:bg-muted"
                                    )}
                                >
                                    {t.pages[page.key]}
                                </Link>
                            </SheetClose>
                        )
                    })}
                </div>
                <div className="mt-3 px-1">
                    <SheetClose asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-start rounded-lg border-border/70 bg-background/80 text-sm text-muted-foreground hover:text-foreground"
                            data-command-palette-trigger
                        >
                            <Search className="mr-2 h-4 w-4" />
                            {t.common.all_tools} · {t.nav.search}
                        </Button>
                    </SheetClose>
                </div>
            </SheetContent>
        </Sheet>
    )
}
