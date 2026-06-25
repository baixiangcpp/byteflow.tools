"use client"

import * as React from "react"
import { Copy, Braces, Upload, Settings2 } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { getToolHandoffFromSearchParams } from "@/core/routing/tool-handoff"
import { readStorageString, removeStorageKey, writeStorageString } from "@/core/storage/tool-persistence"
import { importTextFile, TEXT_FILE_IMPORT_ACCEPT } from "@/core/files/text-file-import"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { jsonToTs } from "./utils"

const SAMPLE_JSON = `{
  "id": 1,
  "code": "usr_001",
  "email": "user@example.com",
  "isActive": true,
  "address": {
    "line1": "A-12",
    "cityCode": "cn-sh",
    "zipCode": "200000"
  },
  "tags": ["frontend", "typescript"],
  "projects": [
    {
      "id": "proj_001",
      "stars": 42,
      "isPublic": true
    }
  ]
}`

const INPUT_STORAGE_KEY = "byteflow:json-to-typescript:input"
const ROOT_NAME_STORAGE_KEY = "byteflow:json-to-typescript:root-name"
const READONLY_STORAGE_KEY = "byteflow:json-to-typescript:readonly"
const OPTIONAL_STORAGE_KEY = "byteflow:json-to-typescript:optional"
const AUTO_ROOT_NAMES = new Set(["Root", "根节点", "根節點", "ルート", "루트", "Wurzel", "Racine"])

export function JsonToTypeScriptPage() {
    const { t } = useLang()
    const toolT = t.tools["json_to_typescript"] as Record<string, string>
    const defaultRootName = toolT.default_root_name
    const [input, setInput] = React.useState(SAMPLE_JSON)
    const [output, setOutput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [rootName, setRootName] = React.useState(defaultRootName)
    const [useReadonly, setUseReadonly] = React.useState(false)
    const [useOptional, setUseOptional] = React.useState(false)
    const appliedHandoffRef = React.useRef<string | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const { resolvedTheme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)

    React.useEffect(() => {
        removeStorageKey(INPUT_STORAGE_KEY)
        const savedRootName = readStorageString(ROOT_NAME_STORAGE_KEY)
        if (savedRootName !== null) {
            setRootName(AUTO_ROOT_NAMES.has(savedRootName) ? defaultRootName : savedRootName)
        }

        const savedReadonly = readStorageString(READONLY_STORAGE_KEY)
        if (savedReadonly === "1" || savedReadonly === "0") {
            setUseReadonly(savedReadonly === "1")
        }

        const savedOptional = readStorageString(OPTIONAL_STORAGE_KEY)
        if (savedOptional === "1" || savedOptional === "0") {
            setUseOptional(savedOptional === "1")
        }
    }, [defaultRootName])

    React.useEffect(() => {
        // Treat previously auto-saved locale defaults as unset so locale switches do not pin older copy.
        setRootName((current) => (AUTO_ROOT_NAMES.has(current) ? defaultRootName : current))
    }, [defaultRootName])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const handoff = getToolHandoffFromSearchParams(new URLSearchParams(window.location.search), window.location.hash)
        if (!handoff || handoff === appliedHandoffRef.current) return
        appliedHandoffRef.current = handoff
        setInput(handoff)
        setError(null)
    }, [])

    React.useEffect(() => {
        writeStorageString(ROOT_NAME_STORAGE_KEY, rootName)
    }, [rootName])

    React.useEffect(() => {
        writeStorageString(READONLY_STORAGE_KEY, useReadonly ? "1" : "0")
    }, [useReadonly])

    React.useEffect(() => {
        writeStorageString(OPTIONAL_STORAGE_KEY, useOptional ? "1" : "0")
    }, [useOptional])

    React.useEffect(() => {
        if (!input.trim()) {
            setOutput("")
            setError(null)
            return
        }
        try {
            const parsed = JSON.parse(input)
            const result = jsonToTs(parsed, rootName || defaultRootName, {
                readonly: useReadonly,
                optional: useOptional,
            })
            setOutput(result)
            setError(null)
        } catch {
            setError(toolT.invalid_json)
            setOutput("")
        }
    }, [defaultRootName, input, rootName, toolT, useReadonly, useOptional])

    const handleCopy = React.useCallback(async () => {
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: toolT.copy_ts_success,
        })
    }, [output, t.common, toolT])

    const openImportPicker = () => {
        fileInputRef.current?.click()
    }

    const handleImportFile = async (file: File) => {
        try {
            const content = await importTextFile(file)
            setInput(content)
            setError(null)
        } catch {
            toast.error(toolT.import_failed)
        }
    }

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const withModifier = event.metaKey || event.ctrlKey
            if (!withModifier) return
            if ((event.key === "c" || event.key === "C") && event.shiftKey && output) {
                event.preventDefault()
                void handleCopy()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [output, handleCopy])

    const actions: ToolAction[] = [
        {
            id: "import_file",
            label: toolT.import_file,
            icon: Upload,
            onClick: openImportPicker,
        },
        {
            id: "copy_ts",
            label: toolT.copy_ts,
            icon: Copy,
            onClick: handleCopy,
            variant: "default",
            disabled: !output,
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col space-y-8">
            <input
                ref={fileInputRef}
                type="file"
                accept={TEXT_FILE_IMPORT_ACCEPT}
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.currentTarget.value = ""
                    if (!file) return
                    void handleImportFile(file)
                }}
            />

            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                            <Braces className="h-6 w-6 text-primary" />
                            {toolT.title}
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            {toolT.description}
                        </p>
                    </div>
                    <ToolActionBar actions={actions} />
                </div>

                <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-card/50 p-4">
                    <div className="flex items-center gap-3">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                        <label htmlFor="root-name" className="text-sm font-medium">
                            {toolT.root}
                        </label>
                        <Input
                            id="root-name"
                            value={rootName}
                            onChange={(e) => setRootName(e.target.value)}
                            className="h-9 w-40"
                            placeholder={defaultRootName}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="readonly-mode"
                            checked={useReadonly}
                            onCheckedChange={setUseReadonly}
                        />
                        <label htmlFor="readonly-mode" className="text-sm font-medium cursor-pointer">
                            {toolT.readonly}
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="optional-mode"
                            checked={useOptional}
                            onCheckedChange={setUseOptional}
                        />
                        <label htmlFor="optional-mode" className="text-sm font-medium cursor-pointer">
                            {toolT.optional}
                        </label>
                    </div>
                </div>
            </div>

            <div className="grid min-h-[600px] flex-1 grid-cols-1 gap-4 overflow-hidden rounded-lg border bg-card lg:grid-cols-2">
                <div className="flex h-full flex-col border-b lg:border-b-0 lg:border-r">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.json_input}</span>
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                            {input.length} {toolT.chars}
                        </span>
                    </div>
                    <div className="min-h-[300px] flex-1">
                        <MonacoEditor
                            height="100%"
                            defaultLanguage="json"
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

                <div className="flex h-full flex-col">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.ts_output}</span>
                        {output && (
                            <span className="text-[10px] tabular-nums text-muted-foreground">
                                {output.split("\n").length} {toolT.lines}
                            </span>
                        )}
                    </div>
                    <div className="min-h-[300px] flex-1 overflow-hidden relative">
                        {error ? (
                            <div className="absolute inset-0 flex items-center justify-center p-6 bg-background/50 backdrop-blur-sm z-10">
                                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-destructive font-mono text-sm shadow-sm">
                                    {error}
                                </div>
                            </div>
                        ) : null}
                        <MonacoEditor
                            height="100%"
                            defaultLanguage="typescript"
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
