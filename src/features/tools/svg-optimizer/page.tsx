"use client"

import * as React from "react"
import { Minimize2, BarChart3, Upload, Copy, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { FileUploadStatus, type FileUploadStatusState } from "@/features/tool-shell/file-upload-status"
import { MonacoEditor } from "@/features/tool-shell/monaco-editors"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { ensureByteflowMonacoThemes, getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { FILE_INPUT_POLICIES, readTextFileWithPolicy, validateFileAgainstPolicy } from "@/core/files/file-input-policy"
import { sanitizeOptimizedSvg } from "./logic"
import { runSvgOptimizeTask } from "./svg-optimize-task"

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
    const [uploadStatus, setUploadStatus] = React.useState<FileUploadStatusState>("idle")
    const [uploadMessage, setUploadMessage] = React.useState("")
    const [uploadProgress, setUploadProgress] = React.useState<number | undefined>(undefined)
    const [isRunning, setIsRunning] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const abortControllerRef = React.useRef<AbortController | null>(null)
    const filePolicy = FILE_INPUT_POLICIES.svg
    const { theme } = useThemePreference()
    const monacoTheme = getByteflowMonacoThemeName(theme)

    React.useEffect(() => {
        if (!input.trim()) {
            abortControllerRef.current?.abort()
            setOutput("")
            setIsRunning(false)
            return
        }
        abortControllerRef.current?.abort()
        const controller = new AbortController()
        abortControllerRef.current = controller
        setIsRunning(true)
        setUploadStatus("processing")
        setUploadMessage(t.common.processing_file_locally)
        setUploadProgress(65)

        void runSvgOptimizeTask({ svg: input }, { signal: controller.signal })
            .then((result) => {
                if (controller.signal.aborted) return
                setOutput(sanitizeOptimizedSvg(result.optimized))
                setUploadStatus("complete")
                setUploadMessage(t.common.file_ready_locally)
                setUploadProgress(100)
            })
            .catch((error) => {
                if (error instanceof Error && error.message === "WORKER_ABORTED") return
                setOutput("")
                setUploadStatus("error")
                setUploadMessage(error instanceof Error ? error.message : t.common.image_process_failed)
                setUploadProgress(undefined)
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsRunning(false)
            })

        return () => {
            controller.abort()
        }
    }, [input, t.common.file_ready_locally, t.common.image_process_failed, t.common.processing_file_locally])

    const originalSize = new Blob([input]).size
    const optimizedSize = new Blob([output]).size
    const saved = originalSize > 0 ? ((1 - optimizedSize / originalSize) * 100).toFixed(1) : "0"
    const outputDataUri = React.useMemo(
        () => (output ? `data:image/svg+xml;utf8,${encodeURIComponent(output)}` : ""),
        [output],
    )

    const handleFile = async (file: File) => {
        const validation = validateFileAgainstPolicy(file, filePolicy)
        if (!validation.ok) {
            toast.error(validation.reason === "unsupported_type" ? t.common.svg_file_required : validation.message)
            return
        }
        try {
            setUploadStatus("loading")
            setUploadMessage(t.common.loading_file_locally)
            setUploadProgress(25)
            setInput(await readTextFileWithPolicy(file, filePolicy))
        } catch (error) {
            setUploadStatus("error")
            setUploadMessage(error instanceof Error ? error.message : t.common.svg_file_required)
            setUploadProgress(undefined)
            toast.error(error instanceof Error ? error.message : t.common.svg_file_required)
        }
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
            disabled: !output || isRunning,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Trash2,
            onClick: () => {
                abortControllerRef.current?.abort()
                setInput("")
                setUploadStatus("idle")
                setUploadMessage("")
                setUploadProgress(undefined)
                setIsRunning(false)
            },
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
                <FileUploadStatus
                    policy={filePolicy}
                    status={uploadStatus}
                    message={uploadMessage}
                    progress={uploadProgress}
                    onCancel={isRunning || uploadStatus === "loading" ? () => {
                        abortControllerRef.current?.abort()
                        setIsRunning(false)
                        setUploadStatus("cancelled")
                        setUploadMessage(t.common.file_processing_cancelled)
                        setUploadProgress(undefined)
                    } : undefined}
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={filePolicy.accept}
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void handleFile(file)
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
