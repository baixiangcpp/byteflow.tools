"use client"

import * as React from "react"

interface SeoFaqItem {
    q: string
    a: string
}

const TOOL_FAQS: Record<string, { title: string; description: string; faqs: SeoFaqItem[] }> = {
    "json-formatter": {
        title: "JSON Formatter & Validator",
        description:
            "Our JSON Formatter helps you format, validate, and beautify JSON data instantly. All processing happens locally in your browser — your data never leaves your machine.",
        faqs: [
            {
                q: "How does the JSON Formatter work?",
                a: "Paste or type your JSON into the editor. The tool instantly parses, validates, and formats it with proper indentation. If there are syntax errors, they are highlighted in real time.",
            },
            {
                q: "Is my JSON data safe?",
                a: "Yes. The JSON Formatter runs 100% in your browser. No data is ever sent to any server. You can even use it offline after the first load.",
            },
            {
                q: "Can I minify JSON with this tool?",
                a: "Yes. Use the Minify toggle to collapse your JSON into a single line, which is useful for reducing payload sizes in APIs and configuration files.",
            },
            {
                q: "What size JSON can this handle?",
                a: "The editor is powered by Monaco (the same engine as VS Code), so it can handle multi-megabyte files with syntax highlighting and instant formatting.",
            },
        ],
    },
}

export function SeoFaqSection({ toolSlug }: { toolSlug?: string }) {
    const data = toolSlug ? TOOL_FAQS[toolSlug] : null
    if (!data) return null

    return (
        <section className="border-t border-border/30 bg-muted/10 px-6 py-8 mt-auto">
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h2 className="text-lg font-bold tracking-tight">{data.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{data.description}</p>
                </div>
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Frequently Asked Questions
                    </h3>
                    {data.faqs.map((faq, i) => (
                        <details key={i} className="group">
                            <summary className="cursor-pointer text-sm font-medium text-foreground hover:text-primary transition-colors list-none flex items-center gap-2">
                                <span className="text-primary text-xs">▸</span>
                                {faq.q}
                            </summary>
                            <p className="text-sm text-muted-foreground mt-1.5 ml-4 leading-relaxed">{faq.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    )
}
