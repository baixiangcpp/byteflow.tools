"use client"

import * as React from "react"
import { ShieldAlert, Eraser, TestTube2, Copy } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { decodeJwtParts } from "./utils"

export function JwtDecoderPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["jwt_decoder"] as Record<string, string>
    const [input, setInput] = React.useState("")
    const [header, setHeader] = React.useState("")
    const [payload, setPayload] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)

    const { resolvedTheme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)

    React.useEffect(() => {
        if (!input.trim()) {
            setHeader("")
            setPayload("")
            setError(null)
            return
        }

        try {
            const decoded = decodeJwtParts(input)

            setHeader(JSON.stringify(decoded.header, null, 2))
            setPayload(JSON.stringify(decoded.payload, null, 2))
            setError(null)
        } catch {
            setHeader("")
            setPayload("")
            setError(toolT.error_invalid_token)
        }
    }, [input, toolT])

    const handleClear = () => {
        setInput("")
        setHeader("")
        setPayload("")
        setError(null)
    }

    const handleUseSample = () => {
        // Sample JWT with standard claims (expired token, safe for demo)
        const sampleJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIENoZW4iLCJlbWFpbCI6ImFsaWNlQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        setInput(sampleJwt)
    }

    const handleCopyHeader = async () => {
        if (!header) return
        const result = await safeClipboardWrite(header)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: toolT.header_copied || "Header copied",
        })
    }

    const handleCopyPayload = async () => {
        if (!payload) return
        const result = await safeClipboardWrite(payload)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: toolT.payload_copied || "Payload copied",
        })
    }

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: t.common.try_example,
            icon: TestTube2,
            onClick: handleUseSample,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
        },
    ]

    return (
        <div className="flex flex-col h-full space-y-8 max-w-[1400px] mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-primary" />
                        {toolT.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                <Link href={`/${lang}/jwt-workbench`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {toolT.workbench_cta}
                </Link>
            </div>

            {error && (
                <div role="alert" className="p-3 text-sm font-medium text-destructive-foreground bg-destructive/90 rounded-md">
                    {error}
                </div>
            )}

            {/* Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[600px]">
                {/* Input Pane */}
                <div className="flex flex-col h-full border rounded-lg bg-card overflow-hidden">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.encoded_token_label}</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[300px] w-full resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 p-4 font-mono text-sm leading-relaxed"
                            placeholder={toolT.token_placeholder}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* Output Panes */}
                <div className="flex flex-col h-full gap-4">
                    <div className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{toolT.header_label}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`${t.common.copy}: ${toolT.header_label}`}
                                onClick={handleCopyHeader}
                                disabled={!header}
                            >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">{t.common.copy}</span>
                            </Button>
                        </div>
                        <div className="flex-1 min-h-[150px]">
                            <MonacoEditor
                                height="100%"
                                language="json"
                                theme={monacoTheme}
                                beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                                value={header}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    fontFamily: "var(--font-mono)",
                                    lineHeight: 24,
                                    padding: { top: 16 },
                                    scrollBeyondLastLine: false,
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex-[2] flex flex-col border rounded-lg bg-card overflow-hidden">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>{toolT.payload_label}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`${t.common.copy}: ${toolT.payload_label}`}
                                onClick={handleCopyPayload}
                                disabled={!payload}
                            >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">{t.common.copy}</span>
                            </Button>
                        </div>
                        <div className="flex-1 min-h-[300px]">
                            <MonacoEditor
                                height="100%"
                                language="json"
                                theme={monacoTheme}
                                beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                                value={payload}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    fontFamily: "var(--font-mono)",
                                    lineHeight: 24,
                                    padding: { top: 16 },
                                    scrollBeyondLastLine: false,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
