"use client"

import * as React from "react"
import { Minimize2, BarChart3, Upload, Copy, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { optimizeAndSanitizeSvg } from "./logic"

const SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<!-- BF -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="100" height="100" viewBox="0 0 100 100">
  <title>BF</title>
  <desc>BF-100</desc>
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <cc:Work xmlns:cc="http://creativecommons.org/ns#">
        <dc:format xmlns:dc="http://purl.org/dc/elements/1.1/">image/svg+xml</dc:format>
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <g>
    <circle cx="50" cy="50" r="45" fill="#3b82f6" stroke="#1e40af" stroke-width="2" />
    <text x="50" y="55" text-anchor="middle" fill="white" font-size="20" font-weight="bold">BF</text>
  </g>
</svg>`

export function SvgOptimizerPage() {
    const { t } = useLang()
    const toolT = t.tools["svg_optimizer"] as Record<string, string>
    const [input, setInput] = React.useState(SAMPLE_SVG)
    const [output, setOutput] = React.useState("")
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const { theme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(theme)

    React.useEffect(() => {
        if (!input.trim()) {
            setOutput("")
            return
        }
        setOutput(optimizeAndSanitizeSvg(input))
    }, [input])

    const originalSize = new Blob([input]).size
    const optimizedSize = new Blob([output]).size
    const saved = originalSize > 0 ? ((1 - optimizedSize / originalSize) * 100).toFixed(1) : "0"
    const outputDataUri = React.useMemo(
        () => (output ? `data:image/svg+xml;utf8,${encodeURIComponent(output)}` : ""),
        [output],
    )

    const handleFile = (file: File) => {
        const reader = new FileReader()
        reader.onload = (event) => setInput(event.target?.result as string)
        reader.readAsText(file)
    }

    const handleCopy = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const actions: ToolAction[] = [
        {
            id: "upload",
            label: toolT.upload,
            icon: Upload,
            onClick: () => fileInputRef.current?.click(),
        },
        {
            id: "copy",
            label: t.common.copy,
            icon: Copy,
            onClick: handleCopy,
            disabled: !output,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Trash2,
            onClick: () => setInput(""),
            variant: "outline",
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col space-y-8">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Minimize2 className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight">{toolT.title}</h1>
                    </div>
                    <p className="text-muted-foreground">{toolT.description}</p>
                </div>
                
                <ToolActionBar actions={actions} />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".svg"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) handleFile(file)
                    }}
                />
            </div>

            <div className="grid min-h-[600px] flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span className="font-medium">{toolT.input}</span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="tabular-nums">{originalSize} B</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <MonacoEditor
                            language="xml"
                            theme={monacoTheme}
                            beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                            value={input}
                            onChange={(value) => setInput(value || "")}
                            height="100%"
                            options={{
                                minimap: { enabled: false },
                                wordWrap: "on",
                                fontSize: 13,
                                lineNumbers: "on",
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span className="font-medium">{toolT.output}</span>
                        <div className="flex items-center gap-3">
                            {output ? (
                                <div className="flex items-center gap-1.5 rounded-md bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                                    <BarChart3 className="h-3 w-3" />
                                    <span>{originalSize} B → {optimizedSize} B</span>
                                    <span>(-{saved}%)</span>
                                </div>
                            ) : null}
                            <span className="text-xs tabular-nums text-muted-foreground">{optimizedSize} B</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex h-48 shrink-0 items-center justify-center border-b bg-muted/20 p-4">
                            {output ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={outputDataUri}
                                    alt={toolT.title}
                                    className="max-h-full max-w-full object-contain drop-shadow-sm"
                                />
                            ) : (
                                <div className="text-sm text-muted-foreground">{t.common.no_output}</div>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <MonacoEditor
                                language="xml"
                                theme={monacoTheme}
                                beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                                value={output}
                                height="100%"
                                options={{
                                    minimap: { enabled: false },
                                    wordWrap: "on",
                                    fontSize: 13,
                                    lineNumbers: "on",
                                    readOnly: true,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
