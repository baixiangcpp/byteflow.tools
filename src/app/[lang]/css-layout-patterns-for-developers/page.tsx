import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"
import { StaticPageContainer } from "@/components/layout/page-container"

export default async function CssLayoutPatternsForDevelopersPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="css-layout-patterns-for-developers" />
    }

    return (
        <StaticPageContainer as="article" className="space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C4: CSS & Design</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">CSS layout patterns every developer should know</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Teams often lose speed because every new UI starts from scratch. Reusable layout patterns reduce ambiguity, simplify
                    review, and make responsive behavior predictable. This guide covers the highest-leverage patterns that appear across
                    product pages, dashboards, and admin surfaces.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">1. Stack pattern for form-heavy flows</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    The stack pattern is a vertical rhythm system: title, helper copy, field groups, and actions. It works especially well
                    for onboarding flows and settings screens where reading order matters more than horizontal density.
                </p>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Use consistent spacing tokens between semantic sections.</li>
                    <li>Keep labels and validation messages aligned to reduce scan cost.</li>
                    <li>Collapse optional groups behind progressive disclosure.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">2. Split pattern for comparison and editing</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Split panes are ideal when users need simultaneous context: source/preview, before/after, or config/result. Ensure both
                    panes have stable headers and independent scroll behavior to avoid accidental context jumps.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    At narrow breakpoints, stack panes vertically and preserve section headers so users still understand which pane controls
                    input versus output.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">3. Sidebar + content pattern for power tools</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    This pattern separates navigation from work surface. Keep sidebar content task-oriented: filters, presets, and jump links.
                    Avoid placing destructive actions in dense side navigation; move them to contextual toolbars near affected content.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`Screen: data comparison
Need: source + result side by side
Breakpoint: collapse at 1024px`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`Desktop: 2-column split layout
Mobile: stacked layout with pane labels
Actions: sticky action bar above panes`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Recommended CSS tools</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/css-gradient-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_gradient_generator.title}
                    </Link>
                    <Link href={`/${locale}/css-box-shadow-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_box_shadow_generator.title}
                    </Link>
                    <Link href={`/${locale}/css-border-radius-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_border_radius_generator.title}
                    </Link>
                    <Link href={`/${locale}/css-clip-path-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_clip_path_generator.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/modern-css-effects-guide`}>
                        Modern CSS effects: glassmorphism, gradients, and more
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/css-animations-and-transitions-guide`}>
                        Complete guide to CSS animations and transitions
                    </Link>
                </p>
            </footer>
        </StaticPageContainer>
    )
}
