"use client"

import * as React from "react"
import { Code2, Play, Eraser, TestTube2, Copy, Download, ArrowRightLeft, Upload } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { formatJavascript } from "@/features/tools/javascript-formatter/utils"
import { buildToolHandoffLink } from "@/core/routing/tool-handoff"
import { importTextFile, TEXT_FILE_IMPORT_ACCEPT } from "@/core/files/text-file-import"
import { readStorageString, removeStorageKey, writeStorageString } from "@/core/storage/tool-persistence"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

const SAMPLE_CODE = [
  "const rows=[{id:1,code:'u_001',enabled:true},{id:2,code:'u_002',enabled:false}]",
  "const filtered=rows.filter((row)=>row.enabled)",
  "console.log(filtered.map((row)=>row.code).join(','))",
].join("\n")
const INPUT_STORAGE_KEY = "byteflow:javascript-formatter:input"

export function JavascriptFormatterPage() {
  const { t, lang } = useLang()
  const toolT = t.tools["javascript_formatter"] as Record<string, string>
  const text = React.useCallback((key: string) => toolT[key], [toolT])

  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isImportDragActive, setIsImportDragActive] = React.useState(false)
  const [importError, setImportError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const handoffPayload = output || input
  const minifierHandoff = React.useMemo(
    () => buildToolHandoffLink(lang, "javascript-minifier", handoffPayload),
    [handoffPayload, lang],
  )

  React.useEffect(() => {
    const savedInput = readStorageString(INPUT_STORAGE_KEY)
    if (savedInput) {
      setInput(savedInput)
    }
  }, [])

  React.useEffect(() => {
    if (!input.trim()) return
    writeStorageString(INPUT_STORAGE_KEY, input)
  }, [input])

  const handleFormat = React.useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      setError(null)
      return
    }

    try {
      setOutput(formatJavascript(input))
      setError(null)
    } catch {
      setError(text("error_format_js"))
    }
  }, [input, text])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleFormat()
    }, 180)
    return () => clearTimeout(timer)
  }, [handleFormat])

  const handleSample = () => {
    setInput(SAMPLE_CODE)
    setOutput("")
    setError(null)
    setImportError(null)
  }

  const handleClear = () => {
    setInput("")
    setOutput("")
    setError(null)
    setImportError(null)
    removeStorageKey(INPUT_STORAGE_KEY)
  }

  const openImportPicker = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (file: File) => {
    try {
      const content = await importTextFile(file)
      setInput(content)
      setOutput("")
      setError(null)
      setImportError(null)
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : text("import_failed"))
    }
  }

  const handleCopy = React.useCallback(async () => {
    if (!output) return
    const result = await safeClipboardWrite(output)
    if (!result.ok) {
      toast.error(t.common.copy_failed)
      return
    }
    toast.success(t.common.copied, {
      description: t.common.copied_desc,
    })
  }, [output, t.common])

  const handleDownload = () => {
    if (!output) return

    const blob = new Blob([output], { type: "text/javascript;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "script.formatted.js"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const withModifier = event.metaKey || event.ctrlKey
      if (!withModifier) return

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        handleFormat()
        return
      }

      if ((event.key === "c" || event.key === "C") && event.shiftKey && output) {
        event.preventDefault()
        void handleCopy()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [output, handleCopy, handleFormat])

  const actions: ToolAction[] = [
    {
      id: "sample",
      label: t.common.paste,
      icon: TestTube2,
      onClick: handleSample,
    },
    {
      id: "import_file",
      label: text("import_file"),
      icon: Upload,
      onClick: openImportPicker,
    },
    {
      id: "clear",
      label: t.common.clear,
      icon: Eraser,
      onClick: handleClear,
    },
    {
      id: "download",
      label: t.common.download,
      icon: Download,
      onClick: handleDownload,
      disabled: !output,
    },
    {
      id: "to_javascript_minifier",
      label: text("to_javascript_minifier"),
      icon: ArrowRightLeft,
      href: minifierHandoff.href,
      onClick: minifierHandoff.prime,
      disabled: !handoffPayload.trim(),
    },
    {
      id: "format",
      label: t.common.format,
      icon: Play,
      onClick: handleFormat,
      variant: "default",
    },
  ]

  return (
    <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col space-y-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Code2 className="h-6 w-6 text-primary" />
            {text("title")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {text("description")}
          </p>
        </div>
        <ToolActionBar actions={actions} />
      </div>

      <div
        className={`rounded-xl border border-dashed px-4 py-3 transition-colors ${isImportDragActive ? "border-primary bg-primary/10" : "border-border/70 bg-card/40"}`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsImportDragActive(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsImportDragActive(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsImportDragActive(false)
          const file = event.dataTransfer.files?.[0]
          if (!file) return
          void handleImportFile(file)
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {text("drag_drop_import_hint")}
          </p>
          <Button variant="outline" size="sm" onClick={openImportPicker}>
            <Upload className="mr-2 h-4 w-4" />
            {text("import_file")}
          </Button>
        </div>
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
      </div>

      {error ? (
        <div className="rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">
          {error}
        </div>
      ) : null}
      {importError ? (
        <div className="rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">
          {importError}
        </div>
      ) : null}

      <div className="grid min-h-[520px] flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
          <div className="tool-pane-header tool-pane-header-between">
            <span>{t.common.input}</span>
          </div>
          <div className="flex-1 p-0">
            <Textarea
              className="h-full min-h-[420px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
              placeholder={text("input_placeholder")}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
          <div className="tool-pane-header tool-pane-header-between">
            <span>{t.common.output}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} disabled={!output}>
              <Copy className="h-4 w-4" />
              <span className="sr-only">{t.common.copy_output}</span>
            </Button>
          </div>
          <div className="relative flex-1 p-0">
            <Textarea
              className="h-full min-h-[420px] w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-ring/50"
              placeholder={t.common.result_placeholder}
              value={output}
              readOnly
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
