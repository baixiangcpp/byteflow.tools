import Link from "next/link"

type FooterLink = {
    key: string
    href: string
    label: string
}

export function FooterContent({
    allToolsLabel,
    categoryLinks,
    footerCopyright,
    navigationLabel,
    pageLinks,
    siteDescription,
    siteHref,
}: {
    allToolsLabel: string
    categoryLinks: FooterLink[]
    footerCopyright: string
    navigationLabel: string
    pageLinks: FooterLink[]
    siteDescription: string
    siteHref: string
}) {
    const listLinkClass =
        "inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-accent/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"

    return (
        <footer className="relative mt-16 overflow-hidden border-t border-border/65 bg-gradient-to-b from-card/65 via-card/45 to-background">
            <div className="pointer-events-none absolute inset-x-0 -top-20 h-44 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.12),_transparent_72%)]" />
            <div className="pointer-events-none absolute -right-16 top-12 h-52 w-52 rounded-full bg-primary/8 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 bottom-6 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />

            <div className="relative mx-auto w-full max-w-screen-2xl px-4 py-14 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
                    <div className="space-y-5 md:col-span-8">
                        <Link
                            href={siteHref}
                            className="inline-flex min-h-11 items-center rounded-md px-1 text-lg font-semibold tracking-tight text-foreground transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            byteflow.tools
                        </Link>
                        <p className="max-w-md text-sm leading-7 text-muted-foreground">
                            {siteDescription}
                        </p>
                        <nav aria-label={allToolsLabel} className="pt-1">
                            <ul className="flex flex-wrap gap-2">
                                {categoryLinks.map((cat) => (
                                    <li key={cat.key}>
                                        <Link
                                            href={cat.href}
                                            className="inline-flex min-h-11 items-center rounded-full border border-border/75 bg-background/70 px-3.5 text-xs text-muted-foreground transition-colors duration-200 hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm"
                                        >
                                            {cat.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    <nav className="md:col-span-4" aria-label={navigationLabel}>
                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {navigationLabel}
                        </h4>
                        <ul className="space-y-1">
                            {pageLinks.map((page) => (
                                <li key={page.key}>
                                    <Link
                                        href={page.href}
                                        className={listLinkClass}
                                    >
                                        {page.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className="mt-12 border-t border-border/55 pt-6">
                    <p suppressHydrationWarning className="text-xs text-muted-foreground/85">
                        {footerCopyright}
                    </p>
                </div>
            </div>
        </footer>
    )
}
