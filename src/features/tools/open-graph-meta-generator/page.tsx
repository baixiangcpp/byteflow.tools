"use client"

import * as React from "react"
import { Copy, Download, Eraser, Globe2, TestTube2 } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { copyTextWithToolFeedback, downloadedFileFeedback } from "@/features/tool-shell/tool-action-feedback"
import { TextOutputPanel } from "@/features/tool-shell/text-output-panel"
import { ToolPreviewArea } from "@/features/tool-shell/tool-preview-area"
import {
    buildOpenGraphMetaTags,
    buildOpenGraphSnippetDocument,
    normalizeAbsoluteHttpUrl,
    type OpenGraphInput,
} from "@/features/tools/open-graph-meta-generator/utils"
import { ToolPageContainer } from "@/components/layout/page-container"

export function OpenGraphMetaGeneratorPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["open_graph_meta_generator"] as Record<string, string>

    const sample = React.useMemo<OpenGraphInput>(() => ({
        title: toolT.sample_title,
        description: toolT.sample_description,
        url: `https://example.com/${lang}/release-2048`,
        image: "https://example.com/og/release-2048.png",
        type: "website",
        siteName: "example.com",
        twitterCard: "summary_large_image",
        twitterSite: "@s42lab",
    }), [lang, toolT.sample_description, toolT.sample_title])

    const [form, setForm] = React.useState<OpenGraphInput>(sample)

    React.useEffect(() => {
        setForm(sample)
    }, [sample])

    const tags = React.useMemo(() => buildOpenGraphMetaTags(form), [form])
    const output = React.useMemo(() => buildOpenGraphSnippetDocument(tags), [tags])
    const previewUrl = React.useMemo(() => normalizeAbsoluteHttpUrl(form.url), [form.url])
    const previewImage = React.useMemo(() => normalizeAbsoluteHttpUrl(form.image), [form.image])

    const setField = <K extends keyof OpenGraphInput>(key: K, value: OpenGraphInput[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSample = () => setForm(sample)
    const handleReset = () =>
        setForm({
            title: "",
            description: "",
            url: "",
            image: "",
            type: "website",
            siteName: "",
            twitterCard: "summary",
            twitterSite: "",
        })

    const handleCopy = async () => {
        return copyTextWithToolFeedback(t, output, toolT.preview_meta_tags_label || t.common.output)
    }

    const handleDownload = () => {
        const filename = "open-graph-tags.txt"
        const blob = new Blob([output], { type: "text/plain;charset=utf-8" })
        const objectUrl = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = objectUrl
        anchor.download = filename
        anchor.click()
        URL.revokeObjectURL(objectUrl)
        return downloadedFileFeedback(t, filename)
    }

    const actions: ToolAction[] = [
        { id: "sample", label: t.common.sample, icon: TestTube2, onClick: handleSample },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: handleReset },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: handleCopy },
        { id: "download", label: t.common.download, icon: Download, onClick: handleDownload },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Globe2 className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="rounded-lg border bg-background/60">
                        <div className="tool-pane-header">{toolT.meta_fields_label}</div>
                        <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
                            <Field label={toolT.title_field_label} value={form.title} onChange={(v) => setField("title", v)} />
                            <Field label={toolT.site_name_label} value={form.siteName} onChange={(v) => setField("siteName", v)} />
                            <Field label={toolT.url_field_label} value={form.url} onChange={(v) => setField("url", v)} />
                            <Field label={toolT.image_url_label} value={form.image} onChange={(v) => setField("image", v)} />
                            <Field label={toolT.type_field_label} value={form.type} onChange={(v) => setField("type", v)} />
                            <Field label={toolT.twitter_site_label} value={form.twitterSite} onChange={(v) => setField("twitterSite", v)} />

                            <label className="space-y-1.5 rounded-lg border bg-background/70 p-3 sm:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.description_field_label}</span>
                                <Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} className="min-h-[90px] text-sm" />
                            </label>

                            <label className="space-y-1.5 rounded-lg border bg-background/70 p-3 sm:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{toolT.twitter_card_label}</span>
                                <div className="grid grid-cols-2 gap-1">
                                    {(["summary", "summary_large_image"] as const).map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setField("twitterCard", value)}
                                            className={`min-h-11 rounded-md border px-2 text-xs uppercase tracking-wide ${
                                                form.twitterCard === value
                                                    ? "border-primary/40 bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {value}
                                        </button>
                                    ))}
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <span className="text-xs font-normal text-muted-foreground">{toolT.preview_meta_tags_label}</span>
                    </div>
                    <div className="space-y-3 border-b bg-background/30 p-3">
                        <div className="rounded-lg border bg-background p-2">
                            <div className="overflow-hidden rounded-md border">
                                <ToolPreviewArea
                                    title={t.common.preview}
                                    allowBackgroundToggle={false}
                                    allowFullscreen={true}
                                >
                                    {previewImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={previewImage}
                                            alt={toolT.image_preview_alt}
                                            className="max-h-[400px] w-auto rounded object-contain drop-shadow-md"
                                        />
                                    ) : (
                                        <div className="grid h-36 place-items-center text-xs text-muted-foreground">
                                            {toolT.image_preview_alt}
                                        </div>
                                    )}
                                </ToolPreviewArea>
                                <div className="space-y-1 bg-card p-3">
                                    <div className="line-clamp-1 text-sm font-semibold text-foreground">{form.title || toolT.untitled_preview}</div>
                                    <div className="line-clamp-2 text-xs text-muted-foreground">{form.description || toolT.description_preview}</div>
                                    <div className="line-clamp-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                                        {previewUrl || "https://example.com"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <TextOutputPanel
                        title={toolT.preview_meta_tags_label || t.common.output}
                        ariaLabel={toolT.preview_meta_tags_label || t.common.output}
                        value={output}
                        className="flex-1 rounded-none border-0"
                    />
                </div>
            </div>
        </ToolPageContainer>
    )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="space-y-1.5 rounded-lg border bg-background/70 p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            <Input value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} />
        </label>
    )
}
