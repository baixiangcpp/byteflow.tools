"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { isValidLocale, type Locale } from "@/core/i18n/i18n"

type LangErrorProps = {
    error: Error & { digest?: string }
    reset: () => void
}

function resolveLocaleFromPathname(pathname: string | null): Locale | null {
    if (!pathname) return null
    const firstSegment = pathname.split("/").filter(Boolean)[0]
    if (!firstSegment) return null
    return isValidLocale(firstSegment) ? firstSegment : null
}

export default function LangError({ error, reset }: LangErrorProps) {
    const { lang, t } = useLang()
    const pathname = usePathname()

    const locale = useMemo(() => {
        const localeFromPath = resolveLocaleFromPathname(pathname)
        return localeFromPath ?? lang
    }, [lang, pathname])

    const homeHref = `/${locale}`

    useEffect(() => {
        console.error("[route-error]", error)
    }, [error])

    const title = t.common.route_error_title
    const description = t.common.route_error_description
    const retryLabel = t.common.route_error_retry
    const homeLabel = t.common.route_error_home

    return (
        <div className="mx-auto w-full max-w-screen-2xl px-4 pb-10 pt-6 md:px-8 md:pt-10 lg:px-10">
            <section className="mx-auto max-w-2xl rounded-2xl border border-border/70 bg-card/55 p-6 shadow-sm backdrop-blur-sm">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button onClick={reset}>{retryLabel}</Button>
                    <Button asChild variant="outline">
                        <Link href={homeHref}>{homeLabel}</Link>
                    </Button>
                </div>
                {error.digest ? (
                    <p className="mt-4 text-xs text-muted-foreground/80">Error digest: {error.digest}</p>
                ) : null}
            </section>
        </div>
    )
}
