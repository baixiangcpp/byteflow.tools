export type SerpPreviewInput = {
    title: string
    description: string
    url: string
}

export type SerpPreviewReport = {
    titleLength: number
    descriptionLength: number
    warnings: string[]
}

export type HreflangEntry = {
    lang: string
    url: string
}

export type HreflangReport = {
    entries: HreflangEntry[]
    warnings: string[]
}

export type SitemapReport = {
    urlCount: number
    warnings: string[]
}

export type LlmsTxtDraft = {
    content: string
    warnings: string[]
}

