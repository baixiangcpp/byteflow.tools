"use client"

import * as React from "react"
import { Copy, Download, Minimize2, BarChart3, Eraser, CircleAlert, Play, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { minify } from "csso"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

function minifyCss(css: string): { styles: string; warnings: string[] } {
    const result = minify(css, {
        restructure: true,
        forceMediaMerge: true,
    })
    return { styles: result.css, warnings: [] }
}

const SAMPLE_CSS = `/* Reset styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Main container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Navigation */
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: #1a1a2e;
  color: #ffffff;
}

.nav a {
  color: #e94560;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.nav a:hover {
  color: #ff6b6b;
}

/* Card component */
.card {
  border-radius: 8px;
  padding: 1.5rem;
  background: #16213e;
  border: 1px solid #0f3460;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
`

export function CssMinifierPage() {
    const { t } = useLang()
    const [input, setInput] = React.useState("")
    const toolT = t.tools["css_minifier"] as Record<string, string>
    const text = (key: string) => toolT[key]
    const [output, setOutput] = React.useState("")
    const [warnings, setWarnings] = React.useState<string[]>([])
    const [minifyError, setMinifyError] = React.useState<string | null>(null)
    const [isMinifying, setIsMinifying] = React.useState(false)

    const originalSize = new Blob([input]).size
    const minifiedSize = new Blob([output]).size
    const savedPercent = originalSize > 0 && output
        ? ((1 - minifiedSize / originalSize) * 100).toFixed(1)
        : "0.0"

    const handleMinify = () => {
        if (!input.trim()) {
            setOutput("")
            setWarnings([])
            setMinifyError(null)
            return
        }

        setIsMinifying(true)
        try {
            const result = minifyCss(input)
            setOutput(result.styles)
            setWarnings(result.warnings)
            setMinifyError(null)
        } catch {
            setOutput("")
            setWarnings([])
            setMinifyError(text("error_minify_failed"))
        } finally {
            setIsMinifying(false)
        }
    }

    const handleCopy = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: t.common.copied_desc,
        })
    }

    const handleDownload = () => {
        if (!output) return
        const blob = new Blob([output], { type: "text/css;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "style.min.css"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const handleClear = () => {
        setInput("")
        setOutput("")
        setWarnings([])
        setMinifyError(null)
    }

    const handleSample = () => {
        setInput(SAMPLE_CSS)
        setOutput("")
        setWarnings([])
        setMinifyError(null)
    }

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: t.common.sample,
            icon: TestTube2,
            onClick: handleSample,
            disabled: isMinifying,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
            disabled: isMinifying,
        },
        {
            id: "download",
            label: t.common.download,
            icon: Download,
            onClick: handleDownload,
            disabled: !output || isMinifying,
        },
        {
            id: "minify",
            label: isMinifying ? `${t.common.minify}…` : t.common.minify,
            icon: Play,
            onClick: handleMinify,
            variant: "default",
            disabled: isMinifying,
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Minimize2 className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {output ? (
                        <div className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground">
                            <BarChart3 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{originalSize}B → {minifiedSize}B</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">-{savedPercent}%</span>
                        </div>
                    ) : null}
                    <ToolActionBar actions={actions} />
                </div>
            </div>

            {minifyError ? (
                <div className="flex items-start gap-2 rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{minifyError}</span>
                </div>
            ) : null}

            {warnings.length > 0 ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                    {text("warnings_found").replace("{count}", String(warnings.length))}
                </div>
            ) : null}

            <div className="grid min-h-[520px] flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.input}</span>
                        <span className="text-xs font-normal text-muted-foreground">{originalSize} bytes</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[420px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder=".card {\n  display: grid;\n  gap: 12px;\n}"
                            spellCheck={false}
                        />
                    </div>
                </div>

                <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.output}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-normal text-muted-foreground">{minifiedSize} bytes</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void handleCopy()} disabled={!output}>
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">{t.common.copy}</span>
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            readOnly
                            value={output}
                            className="h-full min-h-[420px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
                            placeholder=".card{display:grid;gap:12px}"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
