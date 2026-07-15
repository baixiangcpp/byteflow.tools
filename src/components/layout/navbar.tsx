import Link from "next/link"
import { ArrowUpRight, ChevronDown, Globe, Search, Sun, Workflow } from "lucide-react"
import { DeferredMobileNavMenu } from "./deferred-mobile-nav-menu"
import { DeferredNavbarControls } from "./deferred-navbar-controls"
import { Button } from "@/components/ui/button"
import { LOCALE_NAMES, type Locale } from "@/core/i18n/i18n"
import { getAllToolsHref } from "@/core/routing/all-tools-route"
import { cn } from "@/core/utils/utils"
import { buildHomepageHref } from "@/core/routing/homepage-route"

export type NavbarLabels = {
    allTools: string
    openNavigation: string
    pipelineBuilder: string
    search: string
}

export function Navbar({
    lang,
    labels,
}: {
    lang: Locale
    labels: NavbarLabels
}) {
    const homeHref = buildHomepageHref(lang)
    const allToolsHref = getAllToolsHref(lang)

    return (
        <header
            className="sticky top-0 z-50 px-3 pt-3 md:px-6 md:pt-4"
            style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
        >
            <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 shadow-xl shadow-black/10 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72 dark:shadow-black/35 md:gap-3 md:px-4">
                <Link
                    href={homeHref}
                    className="mr-1 flex shrink-0 items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted/65 max-[420px]:mr-0 max-[420px]:gap-2"
                >
                    <span className="relative block h-8 w-8 overflow-hidden rounded-lg ring-1 ring-primary/35">
                        {/* Tiny fixed-size local asset; avoiding next/image keeps its client runtime out of the home shell. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/brand-mark-64.png"
                            alt=""
                            width={32}
                            height={32}
                            loading="eager"
                            decoding="async"
                            className="h-8 w-8 object-cover"
                        />
                    </span>
                    <span className="max-w-[140px] truncate text-base font-semibold tracking-tight max-[420px]:max-w-[88px] max-[420px]:text-sm">
                        byteflow.tools
                    </span>
                </Link>

                <Button
                    variant="outline"
                    className="relative ml-2 hidden h-11 min-w-0 flex-1 justify-start rounded-xl border-border/75 bg-background/78 text-sm font-normal text-muted-foreground shadow-none transition-colors hover:text-foreground lg:flex"
                    data-command-palette-trigger
                >
                    <span>{labels.search}</span>
                    <kbd suppressHydrationWarning className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded-md border border-border/80 bg-muted/70 px-1.5 text-[10px] font-medium uppercase text-muted-foreground xl:inline-flex">
                        Ctrl/Cmd
                        <span className="text-foreground">K</span>
                    </kbd>
                </Button>

                <div className="ml-auto flex shrink-0 items-center gap-1.5 max-[420px]:gap-0.5">
                    <Link
                        href={`/${lang}/pipeline-builder`}
                        className={cn(
                            "hidden min-h-10 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 lg:inline-flex",
                            "text-primary hover:border-primary/50 hover:bg-primary/15"
                        )}
                    >
                        <Workflow className="h-3.5 w-3.5" />
                        {labels.pipelineBuilder}
                    </Link>

                    <Link
                        href={allToolsHref}
                        className={cn(
                            "hidden min-h-10 items-center gap-1.5 rounded-lg border border-border/75 bg-background/65 px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 lg:inline-flex",
                            "text-muted-foreground hover:border-primary/35 hover:text-foreground"
                        )}
                    >
                        {labels.allTools}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>

                    <DeferredMobileNavMenu menuLabel={labels.openNavigation} />

                    <Button
                        variant="outline"
                        size="icon"
                        className="inline-flex h-11 w-11 rounded-lg sm:hidden"
                        data-command-palette-trigger
                        aria-label={labels.search}
                    >
                        <Search className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        className="relative hidden h-11 w-56 justify-start rounded-xl border-border/75 bg-background/78 text-sm font-normal text-muted-foreground shadow-none transition-colors hover:text-foreground sm:flex lg:hidden"
                        data-command-palette-trigger
                    >
                        <span>{labels.search}</span>
                        <kbd suppressHydrationWarning className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded-md border border-border/80 bg-muted/70 px-1.5 text-[10px] font-medium uppercase text-muted-foreground md:inline-flex">
                            Ctrl/Cmd
                            <span className="text-foreground">K</span>
                        </kbd>
                    </Button>
                    <div className="relative h-11 shrink-0" data-navbar-controls-footprint>
                        <div className="invisible flex h-11 items-center gap-1.5" aria-hidden="true">
                            <div className="flex h-11 items-center gap-1 px-2.5">
                                <Globe className="h-4 w-4" />
                                <span className="hidden text-xs 2xl:inline">{LOCALE_NAMES[lang]}</span>
                                <ChevronDown className="h-3 w-3" />
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center">
                                <Sun className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center gap-1.5">
                            <DeferredNavbarControls languageLabel={LOCALE_NAMES[lang]} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
