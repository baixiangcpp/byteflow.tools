"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Copy, Eye, Code2, Download, Trash2 } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { sanitizeHtml } from "@/core/security/sanitize"

const SAMPLE_MARKDOWN_BY_LANG = {
    en: `# Hello, Markdown! 👋

Welcome to **local preview**.

## Features
- ✅ GitHub Flavored Markdown (GFM)
- ✅ Live split-pane preview
- ✅ Tables, task lists, strikethrough
- ✅ Code syntax highlighting
- ✅ Export to HTML

## Code Block
\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

> **Note:** All processing stays local in your browser.
`,
    "zh-CN": `# 你好，Markdown！👋

欢迎使用 **本地预览**。

## 功能
- ✅ 支持 GFM
- ✅ 实时分栏预览
- ✅ 表格、任务列表、删除线
- ✅ 代码高亮
- ✅ 导出 HTML

> **提示：** 所有处理都在浏览器本地完成。
`,
    "zh-TW": `# 你好，Markdown！👋

歡迎使用 **本地預覽**。

## 功能
- ✅ 支援 GFM
- ✅ 即時分欄預覽
- ✅ 表格、任務清單、刪除線
- ✅ 程式碼高亮
- ✅ 匯出 HTML

> **提示：** 所有處理都在瀏覽器本地完成。
`,
    ja: `# こんにちは、Markdown！👋

**ローカルプレビュー** へようこそ。

## 機能
- ✅ GFM 対応
- ✅ リアルタイム分割プレビュー
- ✅ 表・タスクリスト・打ち消し線
- ✅ コードハイライト
- ✅ HTML 書き出し

> **メモ：** すべてブラウザ内でローカル処理されます。
`,
    ko: `# 안녕하세요, Markdown! 👋

**로컬 미리보기**에 오신 것을 환영합니다.

## 기능
- ✅ GFM 지원
- ✅ 실시간 분할 미리보기
- ✅ 표, 작업 목록, 취소선
- ✅ 코드 하이라이트
- ✅ HTML 내보내기

> **참고:** 모든 처리는 브라우저 로컬에서 수행됩니다.
`,
    de: `# Hallo, Markdown! 👋

Willkommen in der **lokalen Vorschau**.

## Funktionen
- ✅ GitHub Flavored Markdown (GFM)
- ✅ Live-Split-Preview
- ✅ Tabellen, Aufgabenlisten, Durchstreichung
- ✅ Code-Highlighting
- ✅ HTML-Export

> **Hinweis:** Alles wird lokal in deinem Browser verarbeitet.
`,
    fr: `# Bonjour, Markdown ! 👋

Bienvenue dans **l'aperçu local**.

## Fonctionnalités
- ✅ Prise en charge GFM
- ✅ Aperçu en temps réel
- ✅ Tableaux, listes de tâches, texte barré
- ✅ Coloration du code
- ✅ Export HTML

> **Note :** Tout le traitement est effectué localement dans votre navigateur.
`,
} as const

const DynamicMarkdownPreviewRenderer = dynamic(
    () => import("@/features/tool-templates/markdown-preview-renderer").then((mod) => mod.MarkdownPreviewRenderer),
    { ssr: false },
)

const ACTION_BUTTON_CLASS =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30 dark:border-input dark:hover:bg-input/50"

const ICON_ACTION_BUTTON_CLASS =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-background shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30 dark:border-input dark:hover:bg-input/50"

async function loadToast() {
    const { toast } = await import("sonner")
    return toast
}

export function MarkdownPreviewPage() {
    const { t, lang } = useLang()
    const sampleMarkdown = SAMPLE_MARKDOWN_BY_LANG[lang as keyof typeof SAMPLE_MARKDOWN_BY_LANG] ?? SAMPLE_MARKDOWN_BY_LANG.en
    const [markdown, setMarkdown] = React.useState<string>(sampleMarkdown)
    const [view, setView] = React.useState<"split" | "editor" | "preview">("split")
    const deferredMarkdown = React.useDeferredValue(markdown)
    const [previewEnabled, setPreviewEnabled] = React.useState(false)
    const toolT = t.tools["markdown_preview"] as Record<string, string>
    const previewVisible = view === "split" || view === "preview"

    const notifyError = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.error(message)
    }, [])

    const notifySuccess = React.useCallback(async (message: string, description: string) => {
        const toast = await loadToast()
        toast.success(message, { description })
    }, [])

    React.useEffect(() => {
        if (!previewVisible || previewEnabled || typeof window === "undefined") return

        let active = true
        let timeoutId: number | null = null
        let idleId: number | null = null

        const enablePreview = () => {
            if (!active) return
            React.startTransition(() => {
                setPreviewEnabled(true)
            })
        }

        const supportsIdleCallback =
            typeof window.requestIdleCallback === "function" &&
            typeof window.cancelIdleCallback === "function"

        if (supportsIdleCallback) {
            idleId = window.requestIdleCallback(enablePreview, { timeout: 250 })
        } else {
            timeoutId = window.setTimeout(enablePreview, 120)
        }

        return () => {
            active = false
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId)
            }
            if (idleId !== null && supportsIdleCallback) {
                window.cancelIdleCallback(idleId)
            }
        }
    }, [previewEnabled, previewVisible])

    const handleCopy = async () => {
        const result = await safeClipboardWrite(markdown)
        if (!result.ok) {
            await notifyError(t.common.copy_failed)
            return
        }
        await notifySuccess(t.common.copied, toolT.copied_md)
    }

    const handleCopyHtml = async () => {
        const previewEl = document.getElementById("markdown-preview")
        if (previewEl) {
            const result = await safeClipboardWrite(sanitizeHtml(previewEl.innerHTML))
            if (!result.ok) {
                await notifyError(t.common.copy_failed)
                return
            }
            await notifySuccess(t.common.copied, toolT.copied_html)
        }
    }

    const handleDownloadHtml = () => {
        const previewEl = document.getElementById("markdown-preview")
        if (!previewEl) return
        const safeHtml = sanitizeHtml(previewEl.innerHTML)
        const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${toolT.export_title}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }
pre { background: #f4f4f4; padding: 1rem; border-radius: 6px; overflow-x: auto; }
code { font-family: 'JetBrains Mono', monospace; font-size: 0.9em; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
th { background: #f0f0f0; }
blockquote { border-left: 4px solid #3b82f6; margin: 1rem 0; padding: 0.5rem 1rem; background: #f8f9fa; }
img { max-width: 100%; }
</style>
</head>
<body>
${safeHtml}
</body>
</html>`
        const blob = new Blob([html], { type: "text/html" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `markdown-preview-${lang}.html`
        a.click()
        URL.revokeObjectURL(url)
        void notifySuccess(t.common.success, toolT.downloaded)
    }

    const handleClear = () => {
        setMarkdown("")
        void notifySuccess(t.common.success, toolT.cleared)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">{toolT.title}</h1>
                        <p className="text-xs text-muted-foreground">{toolT.description}</p>
                    </div>
                </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                    {/* View toggles */}
                    <div className="flex items-center rounded-md border bg-muted p-0.5 gap-0.5">
                        <button
                            type="button"
                            onClick={() => setView("editor")}
                            aria-pressed={view === "editor"}
                            className={`min-h-11 rounded px-2.5 py-1 text-xs font-medium transition-colors ${view === "editor" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Code2 className="h-3.5 w-3.5 inline mr-1" />{toolT.editor}
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("split")}
                            aria-pressed={view === "split"}
                            className={`min-h-11 rounded px-2.5 py-1 text-xs font-medium transition-colors ${view === "split" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {toolT.split}
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("preview")}
                            aria-pressed={view === "preview"}
                            className={`min-h-11 rounded px-2.5 py-1 text-xs font-medium transition-colors ${view === "preview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Eye className="h-3.5 w-3.5 inline mr-1" />{toolT.preview}
                        </button>
                    </div>

                    <button type="button" className={ACTION_BUTTON_CLASS} onClick={() => void handleCopy()}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> {toolT.copy_md}
                    </button>
                    <button type="button" className={ACTION_BUTTON_CLASS} onClick={() => void handleCopyHtml()}>
                        <Code2 className="h-3.5 w-3.5 mr-1" /> {toolT.copy_html}
                    </button>
                    <button type="button" className={ACTION_BUTTON_CLASS} onClick={handleDownloadHtml}>
                        <Download className="h-3.5 w-3.5 mr-1" /> {toolT.export}
                    </button>
                    <button
                        type="button"
                        className={ICON_ACTION_BUTTON_CLASS}
                        onClick={handleClear}
                        aria-label={toolT.cleared}
                        title={toolT.cleared}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                {/* Editor Pane */}
                {(view === "split" || view === "editor") && (
                    <div className={`flex min-h-[320px] flex-col border-b lg:border-r lg:border-b-0 ${view === "split" ? "w-full lg:w-1/2" : "w-full"}`}>
                        <div className="tool-pane-header-compact flex items-center justify-between">
                            <label htmlFor="markdown-source-editor">{toolT.md_source}</label>
                            <span className="text-[10px] tabular-nums">{markdown.length} {toolT.chars}</span>
                        </div>
                        <textarea
                            id="markdown-source-editor"
                            value={markdown}
                            onChange={(e) => setMarkdown(e.target.value)}
                            className="flex-1 resize-none bg-background p-4 font-mono text-sm leading-relaxed placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                            placeholder={toolT.placeholder}
                            spellCheck={false}
                        />
                    </div>
                )}

                {/* Preview Pane */}
                {(view === "split" || view === "preview") && (
                    <div className={`flex min-h-[320px] flex-col ${view === "split" ? "w-full lg:w-1/2" : "w-full"}`}>
                        <div className="tool-pane-header-compact">
                            <span id="markdown-preview-heading">{toolT.preview_tab}</span>
                        </div>
                        {previewEnabled ? (
                            <DynamicMarkdownPreviewRenderer
                                markdown={deferredMarkdown}
                                ariaLabelledby="markdown-preview-heading"
                                className="flex-1 overflow-auto p-6 prose prose-invert prose-sm max-w-none
                                           prose-headings:text-foreground prose-headings:font-bold
                                           prose-h1:text-2xl prose-h1:border-b prose-h1:border-border prose-h1:pb-2
                                           prose-h2:text-xl
                                           prose-p:text-foreground/90 prose-p:leading-relaxed
                                           prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                           prose-strong:text-foreground
                                           prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                                           prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg
                                           prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:bg-muted/30 prose-blockquote:rounded-r
                                           prose-table:border prose-th:bg-muted/50 prose-th:border prose-th:border-border prose-td:border prose-td:border-border
                                           prose-hr:border-border
                                           prose-img:rounded-lg
                                           prose-li:text-foreground/90 prose-li:marker:text-primary"
                            />
                        ) : (
                            <div role="status" className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                                                        {t.common.preview_will_appear_here}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
