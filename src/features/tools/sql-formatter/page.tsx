"use client"

import * as React from "react"
import { Play, Copy, Eraser, Database, AlignLeft } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { format as formatSql } from "sql-formatter"
import { readStorageString, removeStorageKey, writeStorageString } from "@/core/storage/tool-persistence"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { WideToolPageContainer } from "@/components/layout/page-container"

const INPUT_STORAGE_KEY = "byteflow:sql-formatter:input";
const DIALECT_STORAGE_KEY = "byteflow:sql-formatter:dialect";
const DIALECT_OPTIONS = new Set(["sql", "postgresql", "mysql", "mariadb", "sqlite", "transactsql"]);
const ACTION_BUTTON_CLASS =
    "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30 dark:border-input dark:hover:bg-input/50"
const PRIMARY_ACTION_BUTTON_CLASS =
    "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
const ICON_BUTTON_CLASS =
    "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

async function loadToast() {
    const { toast } = await import("sonner")
    return toast
}

export function SqlFormatterPage() {
    const { t } = useLang()
    const toolT = t.tools["sql_formatter"] as Record<string, string>
    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [language, setLanguage] = React.useState("postgresql")

    const { resolvedTheme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)

    const notifyError = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.error(message)
    }, [])

    const notifySuccess = React.useCallback(async (message: string, description: string) => {
        const toast = await loadToast()
        toast.success(message, { description })
    }, [])

    React.useEffect(() => {
        removeStorageKey(INPUT_STORAGE_KEY)
        const savedDialect = readStorageString(DIALECT_STORAGE_KEY)
        if (savedDialect && DIALECT_OPTIONS.has(savedDialect)) {
            setLanguage(savedDialect)
        }
    }, [])

    React.useEffect(() => {
        writeStorageString(DIALECT_STORAGE_KEY, language)
    }, [language])

    const doFormatSql = React.useCallback(() => {
        if (!input.trim()) {
            setOutput("")
            setError(null)
            return
        }

        try {
            const formatted = formatSql(input, {
                language: language as "sql" | "postgresql" | "mysql" | "mariadb" | "sqlite" | "transactsql",
                tabWidth: 2,
                linesBetweenQueries: 2,
            })
            setOutput(formatted)
            setError(null)
        } catch (e: unknown) {
            setError((e instanceof Error ? e.message : String(e)) || toolT.error_invalid_syntax)
        }
    }, [input, language, toolT.error_invalid_syntax])

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const withModifier = event.metaKey || event.ctrlKey
            if (!withModifier || event.key !== "Enter" || event.shiftKey) return
            event.preventDefault()
            doFormatSql()
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [doFormatSql])

    React.useEffect(() => {
        const timer = setTimeout(() => {
            doFormatSql()
        }, 180)
        return () => clearTimeout(timer)
    }, [doFormatSql])

    const minifySql = () => {
        if (!input.trim()) return
        try {
            // sql-formatter doesn't have a direct minify option, so we do a basic regex minification
            const minified = input
                .replace(/--.*$/gm, '') // Remove single line comments
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
                .replace(/\s+/g, ' ') // Collapse whitespace
                .trim();
            setOutput(minified)
            setError(null)
        } catch (e: unknown) {
            setError((e instanceof Error ? e.message : String(e)) || toolT.error_minify_failed)
        }
    }

    const handleCopy = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            await notifyError(t.common.copy_failed)
            return
        }
        await notifySuccess(t.common.copied, toolT.copied_output_desc)
    }

    const handleClear = () => {
        setInput("")
        setOutput("")
        setError(null)
        removeStorageKey(INPUT_STORAGE_KEY)
    }

    return (
        <WideToolPageContainer className="flex flex-col h-full space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        {toolT.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder={toolT.dialect_placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sql">{toolT.dialect_standard_sql}</SelectItem>
                            <SelectItem value="postgresql">{toolT.dialect_postgresql}</SelectItem>
                            <SelectItem value="mysql">{toolT.dialect_mysql}</SelectItem>
                            <SelectItem value="mariadb">{toolT.dialect_mariadb}</SelectItem>
                            <SelectItem value="sqlite">{toolT.dialect_sqlite}</SelectItem>
                            <SelectItem value="transactsql">{toolT.dialect_tsql}</SelectItem>
                        </SelectContent>
                    </Select>
                    <button type="button" className={ACTION_BUTTON_CLASS} onClick={handleClear}>
                        <Eraser className="h-4 w-4" />{t.common.clear}
                    </button>
                    <button type="button" className={ACTION_BUTTON_CLASS} onClick={minifySql}>
                        <AlignLeft className="h-4 w-4" />{t.common.minify}
                    </button>
                    <button type="button" className={PRIMARY_ACTION_BUTTON_CLASS} onClick={doFormatSql}>
                        <Play className="h-4 w-4" />{t.common.format}
                    </button>
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
                            defaultLanguage="sql"
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
                        <button
                            type="button"
                            className={ICON_BUTTON_CLASS}
                            onClick={() => void handleCopy()}
                            disabled={!output}
                        >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">{t.common.copy_output}</span>
                        </button>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <MonacoEditor
                            height="100%"
                            defaultLanguage="sql"
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
        </WideToolPageContainer>
    )
}
