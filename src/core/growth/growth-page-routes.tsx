import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import {
    getGrowthIndex,
    getGrowthPage,
    type GrowthIndexSlug,
    type GrowthPageSlug,
} from "@/core/growth/growth-pages"
import { buildContentMetadata, buildHubMetadata } from "@/core/seo/seo"
import { GrowthContentPage, GrowthIndexPage } from "@/core/seo/components/growth-content-pages"

type LangParams = {
    params: Promise<{ lang: string }>
}

async function resolveLocale(params: Promise<{ lang: string }>) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    return lang
}

export async function generateGrowthPageMetadata({
    params,
    slug,
}: LangParams & {
    slug: GrowthPageSlug
}): Promise<Metadata> {
    const locale = await resolveLocale(params)
    const page = getGrowthPage(slug)
    if (!page) {
        notFound()
    }
    const copy = page.copy[locale]

    return buildContentMetadata({
        lang: locale,
        slug,
        title: copy.title,
        description: copy.description,
    })
}

export async function renderGrowthPage({
    params,
    slug,
}: LangParams & {
    slug: GrowthPageSlug
}) {
    const locale = await resolveLocale(params)
    if (!getGrowthPage(slug)) {
        notFound()
    }

    return <GrowthContentPage locale={locale} slug={slug} />
}

export async function generateGrowthIndexMetadata({
    params,
    slug,
}: LangParams & {
    slug: GrowthIndexSlug
}): Promise<Metadata> {
    const locale = await resolveLocale(params)
    const index = getGrowthIndex(slug)
    if (!index) {
        notFound()
    }

    return buildHubMetadata({
        lang: locale,
        slug,
        title: index.title[locale],
        description: index.description[locale],
    })
}

export async function renderGrowthIndex({
    params,
    slug,
}: LangParams & {
    slug: GrowthIndexSlug
}) {
    const locale = await resolveLocale(params)
    if (!getGrowthIndex(slug)) {
        notFound()
    }

    return <GrowthIndexPage locale={locale} slug={slug} />
}
