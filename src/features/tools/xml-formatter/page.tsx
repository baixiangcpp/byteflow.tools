"use client"

import * as React from "react"
import { Play, Copy, Eraser, CodeXml, AlignLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import format from "xml-formatter"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

export function XmlFormatterPage() {
    const { t } = useLang()
    const toolT = t.tools["xml_formatter"] as Record<string, string>
    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const { resolvedTheme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)

    const formatXml = React.useCallback(() => {
        if (!input.trim()) {
            setOutput("")
            setError(null)
            return
        }

        try {
            const formatted = format(input, {
                indentation: '  ',
                filter: (node) => node.type !== 'Comment',
                collapseContent: true,
                lineSeparator: '\n'
            })
            setOutput(formatted)
            setError(null)
        } catch (e: unknown) {
            setError((e instanceof Error ? e.message : String(e)) || toolT.error_invalid_syntax)
        }
    }, [input, toolT.error_invalid_syntax])

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const withModifier = event.metaKey || event.ctrlKey
            if (!withModifier || event.key !== "Enter" || event.shiftKey) return
            event.preventDefault()
            formatXml()
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [formatXml])

    React.useEffect(() => {
        const timer = setTimeout(() => {
            formatXml()
        }, 180)
        return () => clearTimeout(timer)
    }, [formatXml])

    const minifyXml = () => {
        if (!input.trim()) return
        try {
            const minified = format(input, {
                indentation: '',
                filter: (node) => node.type !== 'Comment',
                collapseContent: true,
                lineSeparator: ''
            })
            setOutput(minified)
            setError(null)
        } catch (e: unknown) {
            setError((e instanceof Error ? e.message : String(e)) || toolT.error_invalid_syntax)
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

    const handleClear = () => {
        setInput("")
        setOutput("")
        setError(null)
    }

    return (
        <div className="flex flex-col h-full space-y-8 max-w-[1400px] mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <CodeXml className="h-6 w-6 text-primary" />
                        {toolT.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleClear}>
                        <Eraser className="mr-2 h-4 w-4" />{t.common.clear}</Button>
                    <Button variant="outline" size="sm" onClick={minifyXml}>
                        <AlignLeft className="mr-2 h-4 w-4" />{t.common.minify}</Button>
                    <Button size="sm" onClick={formatXml}>
                        <Play className="mr-2 h-4 w-4" />{t.common.format}</Button>
                </div>
            </div>

            {error && (
                <div className="p-3 text-sm font-medium text-destructive-foreground bg-destructive/90 rounded-md">
                    {error}
                </div>
            )}
            <p className="text-xs text-muted-foreground">{t.common.format} · Ctrl/Cmd + Enter</p>

            {/* Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[600px] border rounded-lg bg-card overflow-hidden">

                {/* Input Pane */}
                <div className="flex flex-col h-full border-b lg:border-b-0 lg:border-r">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.input}</span>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <MonacoEditor
                            height="100%"
                            defaultLanguage="xml"
                            theme={monacoTheme}
                            beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                            value={input}
                            onChange={(val) => setInput(val || "")}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "var(--font-mono)",
                                lineHeight: 24,
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                                wordWrap: "on",
                            }}
                        />
                    </div>
                </div>

                {/* Output Pane */}
                <div className="flex flex-col h-full">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.output}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void handleCopy()} disabled={!output}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">{t.common.copy_output}</span>
                        </Button>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <MonacoEditor
                            height="100%"
                            defaultLanguage="xml"
                            theme={monacoTheme}
                            beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                            value={output}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "var(--font-mono)",
                                lineHeight: 24,
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                                wordWrap: "on",
                            }}
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}
