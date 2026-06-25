"use client"

import * as React from "react"
import {
    Play,
    Eraser,
    Braces,
    AlignLeft,
    ListTree,
    Upload,
    ArrowRightLeft,
    TestTube2,
    Workflow,
    Download,
} from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { copyTextWithToolFeedback, downloadedFileFeedback } from "@/features/tool-shell/tool-action-feedback"
import type { OutputWrapMode } from "@/features/tool-shell/text-output-panel"
import { ToolEmptyState } from "@/features/tool-shell/tool-empty-state"
import { readStorageString, writeStorageString, removeStorageKey } from "@/core/storage/tool-persistence"
import { enforceToolInputPersistencePolicy } from "@/core/storage/tool-persistence-policy"
import { importTextFile } from "@/core/files/text-file-import"
import { buildSensitiveToolHandoffLink, getToolHandoffFromSearchParams } from "@/core/routing/tool-handoff"
import { buildJsonParseErrorDetails, type JsonParseErrorDetails } from "@/features/tools/json-formatter/error-utils"
import { runJsonFormatTask, type JsonFormatMode } from "@/features/tools/json-formatter/format-json-task"
import { PrivacyBadge } from "@/features/tool-shell/privacy-badge"
import { PrivacyFAQ } from "@/features/tool-shell/privacy-faq"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { JsonImportDropzone } from "./json-import-dropzone"
import { JsonOutputToolbar } from "./json-output-toolbar"
import { JsonTreeSearch } from "./json-tree-search"
import { JsonErrorAlert, JsonInputHeader, JsonTextOutputEmptyState, JsonTreeEditDialog } from "./panels"
import { INPUT_STORAGE_DEBOUNCE_MS, INPUT_STORAGE_KEY, JSON_EDITOR_OPTIONS, JSON_FORMATTER_PERSISTENCE_POLICY, JSON_OUTPUT_EDITOR_OPTIONS, VIEW_MODE_STORAGE_KEY } from "./constants"
import {
    findMatchingPaths,
    getAllPaths,
    getValueAtPath,
    isJsonObject,
    pathKey,
    removeValueAtPath,
    renameObjectKey,
    updateValueAtPath,
} from "./logic"
import { JsonTreeNode } from "./components"
import { SAMPLE_JSON_SOURCE } from "./samples"
import { downloadJsonOutput } from "./browser-actions"
import type { JsonPath, JsonValue, TreeDialogState, ViewMode } from "./types"

export function JsonFormatterPage() {
    const { t, lang } = useLang()
    const toolT = t.tools["json_formatter"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key], [toolT])
    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [errorDetails, setErrorDetails] = React.useState<JsonParseErrorDetails | null>(null)
    const [isImportDragActive, setIsImportDragActive] = React.useState(false)
    const [viewMode, setViewMode] = React.useState<ViewMode>("text")
    const [outputWrapMode, setOutputWrapMode] = React.useState<OutputWrapMode>("wrap")
    const [treeData, setTreeData] = React.useState<JsonValue | null>(null)
    const [expanded, setExpanded] = React.useState<Set<string>>(new Set(["$"]))
    const [treeDialog, setTreeDialog] = React.useState<TreeDialogState>(null)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isSearchOpen, setIsSearchOpen] = React.useState(false)
    const [isFormatting, setIsFormatting] = React.useState(false)

    const searchResults = React.useMemo(() => {
        if (!treeData || !searchQuery.trim()) return { matched: new Set<string>(), parents: new Set<string>() }
        return findMatchingPaths(treeData, searchQuery.trim())
    }, [treeData, searchQuery])

    React.useEffect(() => {
        if (searchResults.parents.size > 0) {
            setExpanded(prev => {
                const next = new Set(prev)
                searchResults.parents.forEach(p => next.add(p))
                return next
            })
        }
    }, [searchResults.parents])

    const { resolvedTheme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(resolvedTheme)
    const fileInputRef = React.useRef<HTMLInputElement | null>(null)
    const outputPaneRef = React.useRef<HTMLDivElement | null>(null)
    const appliedHandoffRef = React.useRef<string | null>(null)
    const formatRequestIdRef = React.useRef(0)
    const formatAbortControllerRef = React.useRef<AbortController | null>(null)
    const [lastFormatMode, setLastFormatMode] = React.useState<JsonFormatMode>("format")
    React.useEffect(() => {
        const savedMode = readStorageString(VIEW_MODE_STORAGE_KEY)
        if (savedMode === "text" || savedMode === "tree") {
            setViewMode(savedMode)
        }

        removeStorageKey(INPUT_STORAGE_KEY)
    }, [])

    React.useEffect(() => {
        writeStorageString(VIEW_MODE_STORAGE_KEY, viewMode)
    }, [viewMode])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const handoff = getToolHandoffFromSearchParams(new URLSearchParams(window.location.search), window.location.hash)
        if (!handoff || handoff === appliedHandoffRef.current) return
        appliedHandoffRef.current = handoff
        setInput(handoff)
        setOutput("")
        setTreeData(null)
        setExpanded(new Set(["$"]))
        setViewMode("text")
        setError(null)
    }, [])

    React.useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            enforceToolInputPersistencePolicy(JSON_FORMATTER_PERSISTENCE_POLICY, input)
        }, INPUT_STORAGE_DEBOUNCE_MS)

        return () => window.clearTimeout(timeoutId)
    }, [input])

    const parseSource = React.useCallback((source: string): JsonValue | null => {
        if (!source.trim()) {
            setError(null)
            setErrorDetails(null)
            return null
        }
        try {
            const parsed = JSON.parse(source) as JsonValue
            setError(null)
            setErrorDetails(null)
            return parsed
        } catch (err) {
            const details = buildJsonParseErrorDetails(source, err, text)
            setError(details.message)
            setErrorDetails(details)
            return null
        }
    }, [text])

    const applyTreeValue = React.useCallback((nextValue: JsonValue) => {
        const pretty = JSON.stringify(nextValue, null, 2)
        setTreeData(nextValue)
        setInput(pretty)
        setOutput(pretty)
        setError(null)
        setErrorDetails(null)
    }, [])

    const buildTreeFromCurrentText = React.useCallback(() => {
        const source = input.trim() ? input : output
        const parsed = parseSource(source)
        if (parsed === null) {
            if (!source.trim()) {
                setTreeData(null)
                setExpanded(new Set(["$"]))
                return true
            }
            return false
        }

        setTreeData(parsed)
        setOutput(JSON.stringify(parsed, null, 2))
        setExpanded(new Set(["$"]))
        return true
    }, [input, output, parseSource])

    const scrollOutputIntoViewOnMobile = React.useCallback(() => {
        if (window.innerWidth < 1024) {
            window.requestAnimationFrame(() => {
                outputPaneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            })
        }
    }, [])

    const handleInputChange = React.useCallback((nextInput: string) => {
        setInput(nextInput)
        if (output || treeData !== null) {
            setOutput("")
            setTreeData(null)
            setExpanded(new Set(["$"]))
        }
        setError(null)
        setErrorDetails(null)
    }, [output, treeData])

    const runJsonFormat = React.useCallback(async (source: string, mode: JsonFormatMode) => {
        const requestId = formatRequestIdRef.current + 1
        formatRequestIdRef.current = requestId
        formatAbortControllerRef.current?.abort()

        if (!source.trim()) {
            formatAbortControllerRef.current = null
            setOutput("")
            setTreeData(null)
            setError(null)
            setErrorDetails(null)
            return
        }

        const controller = new AbortController()
        formatAbortControllerRef.current = controller
        setIsFormatting(true)
        try {
            const result = await runJsonFormatTask(source, mode, { signal: controller.signal })
            if (formatRequestIdRef.current !== requestId) return
            setOutput(result.output)
            setTreeData(result.parsed)
            setLastFormatMode(mode)
            setError(null)
            setErrorDetails(null)
            scrollOutputIntoViewOnMobile()
        } catch (err) {
            if (formatRequestIdRef.current !== requestId) return
            const details = buildJsonParseErrorDetails(source, err, text)
            setOutput("")
            setTreeData(null)
            setExpanded(new Set(["$"]))
            setError(details.message)
            setErrorDetails(details)
        } finally {
            if (formatRequestIdRef.current === requestId) {
                formatAbortControllerRef.current = null
                setIsFormatting(false)
            }
        }
    }, [scrollOutputIntoViewOnMobile, text])

    const formatJsonSource = React.useCallback((source: string) => {
        void runJsonFormat(source, "format")
    }, [runJsonFormat])

    const formatJson = React.useCallback(() => {
        void runJsonFormat(input, "format")
    }, [input, runJsonFormat])

    const minifyJson = React.useCallback(() => {
        if (!input.trim()) return

        void runJsonFormat(input, "minify")
    }, [input, runJsonFormat])

    const handleCopy = React.useCallback(async () => {
        const copyText = viewMode === "tree" && treeData !== null
            ? JSON.stringify(treeData, null, 2)
            : output

        if (!copyText) return
        return copyTextWithToolFeedback(t, copyText, t.common.output, t.common.copied_desc)
    }, [output, t, treeData, viewMode])

    const handleDownload = React.useCallback(() => {
        const content = viewMode === "tree" && treeData !== null
            ? JSON.stringify(treeData, null, 2)
            : output

        if (!content || error) return
        const filename = lastFormatMode === "minify" ? "minified.json" : "formatted.json"
        downloadJsonOutput(content, filename)
        return downloadedFileFeedback(t, filename)
    }, [error, lastFormatMode, output, t, treeData, viewMode])

    const handleClear = () => {
        setInput("")
        setOutput("")
        setTreeData(null)
        setExpanded(new Set(["$"]))
        setError(null)
        setErrorDetails(null)
        removeStorageKey(INPUT_STORAGE_KEY)
    }

    const handleExpandAll = () => {
        if (!treeData) return
        const all = getAllPaths(treeData)
        setExpanded(all)
    }

    const handleCollapseAll = () => {
        setExpanded(new Set(["$"]))
    }

    const handleImportFile = async (file: File) => {
        try {
            const content = await importTextFile(file)
            setInput(content)
            setOutput("")
            setTreeData(null)
            setExpanded(new Set(["$"]))
            setError(null)
            setErrorDetails(null)
            toast.success(text("file_imported"), {
                description: file.name,
            })
        } catch (importError) {
            const message = importError instanceof Error ? importError.message : text("file_import_failed")
            setError(message)
            setErrorDetails(null)
        }
    }

    const openImportPicker = () => {
        fileInputRef.current?.click()
    }

    const handoffPayload = React.useMemo(() => {
        if (viewMode === "tree" && treeData !== null) {
            return JSON.stringify(treeData, null, 2)
        }
        return output || input
    }, [input, output, treeData, viewMode])

    const jsonToTypescriptHandoff = React.useMemo(
        () => buildSensitiveToolHandoffLink(lang, "json-to-typescript"),
        [lang],
    )
    const pipelineHandoff = React.useMemo(
        () => buildSensitiveToolHandoffLink(lang, "pipeline-builder"),
        [lang],
    )

    const switchViewMode = (nextMode: ViewMode) => {
        if (nextMode === "tree") {
            const ok = buildTreeFromCurrentText()
            if (!ok) return
        }
        setViewMode(nextMode)
    }

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const withModifier = event.metaKey || event.ctrlKey
            if (!withModifier) return

            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                formatJson()
                return
            }

            if (event.key === "Enter" && event.shiftKey) {
                event.preventDefault()
                minifyJson()
                return
            }

            if ((event.key === "c" || event.key === "C") && event.shiftKey && (output || treeData !== null)) {
                event.preventDefault()
                void handleCopy()
            }

            if ((event.key === "f" || event.key === "F") && withModifier && viewMode === "tree") {
                event.preventDefault()
                setIsSearchOpen(true)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [output, treeData, formatJson, minifyJson, handleCopy, viewMode])

    const handleUseSample = () => {
        setInput(SAMPLE_JSON_SOURCE)
        setExpanded(new Set(["$"]))
        setError(null)
        setErrorDetails(null)
        formatJsonSource(SAMPLE_JSON_SOURCE)
    }

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: t.common.sample,
            icon: TestTube2,
            onClick: handleUseSample,
        },
        {
            id: "import_file",
            label: text("import_file"),
            icon: Upload,
            onClick: openImportPicker,
        },
        {
            id: "to_json_to_typescript",
            label: text("handoff_json_to_typescript"),
            icon: ArrowRightLeft,
            href: jsonToTypescriptHandoff.href,
            onClick: jsonToTypescriptHandoff.prime,
            disabled: !handoffPayload.trim(),
            disabledReason: t.common.action_disabled_no_output,
        },
        {
            id: "to_pipeline_builder",
            label: (t.tools["pipeline_builder"] as Record<string, string> | undefined)?.title ?? "Pipeline Builder",
            icon: Workflow,
            href: pipelineHandoff.href,
            onClick: pipelineHandoff.prime,
            disabled: !handoffPayload.trim(),
            disabledReason: t.common.action_disabled_no_output,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
            destructive: true,
        },
        {
            id: "minify",
            label: t.common.minify,
            icon: AlignLeft,
            onClick: minifyJson,
            disabled: isFormatting || !input.trim(),
            disabledReason: !input.trim() ? t.common.action_disabled_input_required : undefined,
        },
        {
            id: "format",
            label: t.common.format,
            icon: Play,
            onClick: formatJson,
            variant: "default",
            disabled: isFormatting || !input.trim(),
            disabledReason: !input.trim() ? t.common.action_disabled_input_required : undefined,
        },
        {
            id: "download_json",
            label: text("download_json"),
            icon: Download,
            onClick: handleDownload,
            disabled: Boolean(error) || !(output || treeData !== null),
            disabledReason: Boolean(error)
                ? text("download_disabled_invalid")
                : t.common.action_disabled_no_output,
        },
    ]

    const toggleExpand = (path: JsonPath) => {
        const key = pathKey(path)
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    const handleEditNode = (path: JsonPath, currentValue: JsonValue) => {
        setTreeDialog({
            type: "edit_value",
            path,
            draft: JSON.stringify(currentValue),
        })
    }

    const handleDeleteNode = (path: JsonPath) => {
        if (treeData === null || path.length === 0) return
        const nextTree = removeValueAtPath(treeData, path)
        applyTreeValue(nextTree)
    }

    const handleAddChild = (path: JsonPath) => {
        if (treeData === null) return

        const node = getValueAtPath(treeData, path)
        if (Array.isArray(node)) {
            const nextNode = [...node, null]
            applyTreeValue(updateValueAtPath(treeData, path, nextNode))
            toggleExpand(path)
            return
        }

        if (isJsonObject(node)) {
            setTreeDialog({
                type: "add_key",
                path,
                draft: "",
            })
        }
    }

    const handleRenameKey = (parentPath: JsonPath, currentKey: string) => {
        setTreeDialog({
            type: "rename_key",
            parentPath,
            currentKey,
            draft: currentKey,
        })
    }

    const closeTreeDialog = () => {
        setTreeDialog(null)
    }

    const updateTreeDialogDraft = (draft: string) => {
        setTreeDialog((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                draft,
            }
        })
    }

    const confirmTreeDialog = () => {
        if (treeData === null || treeDialog === null) {
            closeTreeDialog()
            return
        }

        if (treeDialog.type === "edit_value") {
            try {
                const parsed = JSON.parse(treeDialog.draft) as JsonValue
                const nextTree = updateValueAtPath(treeData, treeDialog.path, parsed)
                applyTreeValue(nextTree)
                closeTreeDialog()
            } catch {
                toast.error(text("invalid_json_literal"))
            }
            return
        }

        if (treeDialog.type === "add_key") {
            const nextKey = treeDialog.draft.trim()
            if (!nextKey) return
            const node = getValueAtPath(treeData, treeDialog.path)
            if (!isJsonObject(node)) {
                closeTreeDialog()
                return
            }
            if (Object.prototype.hasOwnProperty.call(node, nextKey)) {
                toast.error(text("key_exists"))
                return
            }
            const nextNode = { ...node, [nextKey]: null }
            applyTreeValue(updateValueAtPath(treeData, treeDialog.path, nextNode))
            toggleExpand(treeDialog.path)
            closeTreeDialog()
            return
        }

        const nextKey = treeDialog.draft.trim()
        if (!nextKey || nextKey === treeDialog.currentKey) {
            closeTreeDialog()
            return
        }

        const nextTree = renameObjectKey(treeData, treeDialog.parentPath, treeDialog.currentKey, nextKey)
        if (nextTree === treeData) {
            toast.error(text("rename_key_failed"))
            return
        }
        applyTreeValue(nextTree)
        closeTreeDialog()
    }

    return (
        <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col space-y-6">
            <JsonTreeEditDialog
                applyLabel={t.common.apply}
                closeLabel={t.common.close}
                dialog={treeDialog}
                onClose={closeTreeDialog}
                onDraftChange={updateTreeDialogDraft}
                onSubmit={confirmTreeDialog}
                text={text}
            />
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Braces className="h-6 w-6 text-primary" />
                        {toolT.title}
                        <PrivacyBadge />
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} handoffPayload={handoffPayload} />
            </div>
            <SensitiveInputWarning />
            <JsonImportDropzone
                fileInputRef={fileInputRef}
                isDragActive={isImportDragActive}
                onDragActiveChange={setIsImportDragActive}
                onImportFile={handleImportFile}
                onOpenImportPicker={openImportPicker}
                text={text}
            />

            <JsonErrorAlert details={errorDetails} error={error} text={text} />

            <div className="grid min-h-[600px] min-w-0 flex-1 grid-cols-1 gap-4 overflow-hidden rounded-lg border bg-card lg:grid-cols-2">
                <div className="flex h-full flex-col border-b lg:border-r lg:border-b-0">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{t.common.input}</span>
                        <JsonInputHeader input={input} text={text} />
                    </div>
                    <div className="min-h-[300px] flex-1">
                        <MonacoEditor
                            height="100%"
                            defaultLanguage="json"
                            theme={monacoTheme}
                            beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                            value={input}
                            onChange={(val) => handleInputChange(val || "")}
                            options={{ ...JSON_EDITOR_OPTIONS, ariaLabel: t.common.input }}
                            aria-describedby={error ? "json-formatter-error" : undefined}
                            aria-invalid={error ? "true" : undefined}
                        />
                    </div>
                </div>

                <div ref={outputPaneRef} className="flex h-full flex-col">
                    <JsonOutputToolbar
                        canCopy={Boolean(output || treeData !== null)}
                        hasTreeData={treeData !== null}
                        isSearchOpen={isSearchOpen}
                        labels={{
                            collapseAll: text("tree_collapse_all"),
                            disabledNoOutput: t.common.action_disabled_no_output,
                            downloadJson: text("download_json"),
                            copyOutput: t.common.copy_output,
                            expandAll: text("tree_expand_all"),
                            output: t.common.output,
                            search: t.common.search,
                            viewText: toolT.view_text,
                            viewTree: toolT.view_tree,
                        }}
                        onCollapseAll={handleCollapseAll}
                        onCopy={handleCopy}
                        onDownload={handleDownload}
                        onExpandAll={handleExpandAll}
                        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
                        onWrapModeChange={setOutputWrapMode}
                        onViewModeChange={switchViewMode}
                        viewMode={viewMode}
                        wrapMode={outputWrapMode}
                    />

                    {viewMode === "text" ? (
                        <div className="min-h-[300px] flex-1">
                            {output ? (
                                <MonacoEditor
                                    height="100%"
                                    defaultLanguage="json"
                                    theme={monacoTheme}
                                    beforeMount={(monaco) => ensureByteflowMonacoThemes(monaco)}
                                    value={output}
                                    options={{
                                        ...JSON_OUTPUT_EDITOR_OPTIONS,
                                        ariaLabel: t.common.output,
                                        wordWrap: outputWrapMode === "wrap" ? "on" : "off",
                                    }}
                                />
                            ) : (
                                <JsonTextOutputEmptyState hasInput={Boolean(input.trim())} text={text} />
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col overflow-hidden relative">
                            <div className="border-b px-3 py-2 text-xs text-muted-foreground">
                                {toolT.tree_hint}
                            </div>
                            <div className="flex-1 overflow-auto p-2">
                                {isSearchOpen ? (
                                    <JsonTreeSearch
                                        closeLabel={t.common.close}
                                        onClose={() => {
                                            setIsSearchOpen(false)
                                            setSearchQuery("")
                                        }}
                                        onQueryChange={setSearchQuery}
                                        placeholder={text("tree_search_placeholder")}
                                        query={searchQuery}
                                    />
                                ) : null}
                                {treeData === null ? (
                                    <ToolEmptyState
                                        icon={ListTree}
                                        title={toolT.tree_empty}
                                        description={text("drag_drop_import_hint")}
                                        className="my-8"
                                    />
                                ) : (
                                    <JsonTreeNode
                                        value={treeData}
                                        path={[]}
                                        depth={0}
                                        expanded={expanded}
                                        matched={searchResults.matched}
                                        text={text}
                                        toggleExpand={toggleExpand}
                                        handleRenameKey={handleRenameKey}
                                        handleAddChild={handleAddChild}
                                        handleEditNode={handleEditNode}
                                        handleDeleteNode={handleDeleteNode}
                                        maxVisibleChildren={200}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PrivacyFAQ />
        </div>
    )
}
