"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"

const MARKDOWN_RENDER_COMPONENTS = {
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h2 {...props}>{children}</h2>
    ),
} as const

type MarkdownPreviewRendererProps = {
    markdown: string
    className?: string
}

export function MarkdownPreviewRenderer({ markdown, className }: MarkdownPreviewRendererProps) {
    return (
        <div id="markdown-preview" className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={MARKDOWN_RENDER_COMPONENTS}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    )
}
