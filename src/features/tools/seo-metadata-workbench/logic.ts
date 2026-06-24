import type { HreflangEntry, HreflangReport, LlmsTxtDraft, SerpPreviewInput, SerpPreviewReport, SitemapReport } from "./types"

export function analyzeSerpPreview(input: SerpPreviewInput): SerpPreviewReport {
    const warnings: string[] = []
    if (!input.title.trim()) warnings.push("Title is required.")
    if (input.title.length > 60) warnings.push("Title is longer than 60 characters and may truncate.")
    if (input.description.length < 80) warnings.push("Description is short; add concrete value and privacy context.")
    if (input.description.length > 160) warnings.push("Description is longer than 160 characters and may truncate.")
    try {
        const url = new URL(input.url)
        if (!["http:", "https:"].includes(url.protocol)) warnings.push("Preview URL should be HTTP or HTTPS.")
    } catch {
        warnings.push("Preview URL is not a valid absolute URL.")
    }
    return {
        titleLength: input.title.length,
        descriptionLength: input.description.length,
        warnings,
    }
}

export function validateHreflang(entries: HreflangEntry[]): HreflangReport {
    const warnings: string[] = []
    const langs = new Set<string>()
    for (const entry of entries) {
        if (!entry.lang.trim()) warnings.push("Every hreflang entry needs a language code.")
        if (langs.has(entry.lang)) warnings.push(`Duplicate hreflang language: ${entry.lang}.`)
        langs.add(entry.lang)
        try {
            new URL(entry.url)
        } catch {
            warnings.push(`Invalid URL for ${entry.lang || "(missing lang)"}.`)
        }
    }
    if (!langs.has("x-default")) warnings.push("Add an x-default alternate for global fallback.")
    if (!langs.has("en")) warnings.push("Add an en alternate for English/default content.")
    return { entries, warnings }
}

export function validateSitemapUrls(urls: string[]): SitemapReport {
    const warnings: string[] = []
    const seen = new Set<string>()
    for (const rawUrl of urls) {
        try {
            const url = new URL(rawUrl)
            if (url.hash || url.search) warnings.push(`${rawUrl} includes query or hash; sitemap URLs should be clean canonicals.`)
            if (seen.has(url.href)) warnings.push(`Duplicate sitemap URL: ${url.href}.`)
            seen.add(url.href)
        } catch {
            warnings.push(`Invalid sitemap URL: ${rawUrl}.`)
        }
    }
    return { urlCount: urls.length, warnings }
}

export function generateLlmsTxtDraft(input: { name: string; summary: string; tools: string[] }): LlmsTxtDraft {
    const warnings: string[] = []
    if (!input.name.trim()) warnings.push("Project name is required.")
    if (input.tools.length < 3) warnings.push("Include at least three representative tools.")
    const content = [
        `# ${input.name}`,
        "",
        `> ${input.summary}`,
        "",
        "## Privacy",
        "- Browser-local by default.",
        "- No account required.",
        "- No server-side tool payload processing.",
        "",
        "## Representative Tools",
        ...input.tools.map((tool) => `- ${tool}`),
        "",
    ].join("\n")
    return { content, warnings }
}

export function runSeoWorkbench(input: string): string {
    const parsed = JSON.parse(input) as {
        title: string
        description: string
        url: string
        hreflang?: HreflangEntry[]
        sitemapUrls?: string[]
        llms?: { name: string; summary: string; tools: string[] }
    }
    const serp = analyzeSerpPreview(parsed)
    const hreflang = validateHreflang(parsed.hreflang ?? [])
    const sitemap = validateSitemapUrls(parsed.sitemapUrls ?? [])
    const llms = generateLlmsTxtDraft(parsed.llms ?? { name: "Project", summary: "", tools: [] })
    return [
        `Title length: ${serp.titleLength}`,
        `Description length: ${serp.descriptionLength}`,
        `Sitemap URLs: ${sitemap.urlCount}`,
        "",
        "Warnings:",
        ...[...serp.warnings, ...hreflang.warnings, ...sitemap.warnings, ...llms.warnings].map((warning) => `- ${warning}`),
        "",
        "llms.txt draft:",
        llms.content,
    ].join("\n")
}

export function runTool(input: string): string {
    return runSeoWorkbench(input)
}

