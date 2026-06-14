"use client"

import * as React from "react"
import { Copy, FileText, Trash2, ArrowLeftRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

interface EnvVar {
    key: string
    value: string
    comment?: string
    isComment: boolean
    isEmpty: boolean
    line: number
}

function parseEnvFile(content: string): EnvVar[] {
    return content.split("\n").map((raw, i) => {
        const trimmed = raw.trim()
        if (!trimmed) return { key: "", value: "", isComment: false, isEmpty: true, line: i + 1 }
        if (trimmed.startsWith("#")) return { key: "", value: "", comment: trimmed.slice(1).trim(), isComment: true, isEmpty: false, line: i + 1 }

        const eqIdx = trimmed.indexOf("=")
        if (eqIdx === -1) return { key: trimmed, value: "", isComment: false, isEmpty: false, line: i + 1 }

        const key = trimmed.slice(0, eqIdx).trim()
        let value = trimmed.slice(eqIdx + 1).trim()
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
        }
        return { key, value, isComment: false, isEmpty: false, line: i + 1 }
    })
}

function envToJson(vars: EnvVar[]): string {
    const obj: Record<string, string> = {}
    vars.filter(v => !v.isComment && !v.isEmpty && v.key).forEach(v => { obj[v.key] = v.value })
    return JSON.stringify(obj, null, 2)
}

function envToYaml(vars: EnvVar[]): string {
    return vars.filter(v => !v.isComment && !v.isEmpty && v.key)
        .map(v => `${v.key}: "${v.value.replace(/"/g, '\\"')}"`)
        .join("\n")
}

function envToDockerArgs(vars: EnvVar[]): string {
    return vars.filter(v => !v.isComment && !v.isEmpty && v.key)
        .map(v => `-e ${v.key}="${v.value}"`)
        .join(" \\\n  ")
}

const SAMPLE_ENV = `# Application Config
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL="postgres://user:pass@localhost:5432/mydb"
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=super-secret-jwt-key-2024
JWT_EXPIRES_IN=7d
SESSION_COOKIE_NAME=__session

# Third-Party API Keys
STRIPE_SECRET_KEY=sk_live_51abc123
SENDGRID_API_KEY=SG.xxxxx.yyyyy
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_RATE_LIMITING=false
DEBUG=false`

const EXPORT_FORMATS = ["json", "yaml", "docker-args"] as const
type ExportFormat = typeof EXPORT_FORMATS[number]

export function EnvVariableParserPage() {
    const { t } = useLang()
    const toolT = t.tools["env_parser"] as Record<string, string>
    const [input, setInput] = React.useState(toolT.sample_input || SAMPLE_ENV)
    const [exportFormat, setExportFormat] = React.useState<ExportFormat>("json")

    const parsed = React.useMemo(() => parseEnvFile(input), [input])
    const vars = parsed.filter(v => !v.isComment && !v.isEmpty && v.key)
    const exportFormatLabels: Record<ExportFormat, string> = React.useMemo(
        () => ({
            json: toolT.export_format_json_label,
            yaml: toolT.export_format_yaml_label,
            "docker-args": toolT.export_format_docker_args_label,
        }),
        [toolT],
    )

    const exported = React.useMemo(() => {
        switch (exportFormat) {
            case "json": return envToJson(parsed)
            case "yaml": return envToYaml(parsed)
            case "docker-args": return envToDockerArgs(parsed)
        }
    }, [parsed, exportFormat])

    const handleCopyExport = async () => {
        const result = await safeClipboardWrite(exported)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, { description: exportFormatLabels[exportFormat] })
    }

    const handleCopyVariable = async (key: string, value: string) => {
        const result = await safeClipboardWrite(`${key}=${value}`)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, { description: key })
    }

    return (
        <div className="flex min-w-0 flex-col h-full">
            <div className="flex flex-col border-b px-4 py-3 gap-2">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">{toolT.title}</h1>
                        <p className="text-xs text-muted-foreground">{toolT.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground border rounded px-2 py-1 tabular-nums">{vars.length} {toolT.vars}</span>
                    <Button variant="outline" size="sm" onClick={() => void handleCopyExport()}>
                        <Copy className="h-3.5 w-3.5 mr-1" />{t.common.copy}</Button>
                    <Button variant="outline" size="sm" onClick={() => setInput("")}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                {/* Input */}
                <div className="flex w-full min-h-[260px] flex-col border-b md:min-h-0 md:w-[40%] md:border-b-0 md:border-r">
                    <div className="tool-pane-header-compact">{toolT.input}</div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 resize-none bg-background p-4 font-mono text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                        placeholder={toolT.input_placeholder}
                        spellCheck={false}
                    />
                </div>

                {/* Parsed table + Export */}
                <div className="flex w-full min-w-0 flex-col md:w-[60%]">
                    {/* Format selector */}
                    <div className="tool-pane-header-compact flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                            <span>{toolT.export_as}</span>
                            <div className="ml-1 flex flex-wrap items-center gap-0.5 rounded-md border bg-background p-0.5">
                                {EXPORT_FORMATS.map(f => (
                                    <button key={f} onClick={() => setExportFormat(f)} className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${exportFormat === f ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                                        {exportFormatLabels[f]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <span className="max-w-full break-words text-right text-[10px] tabular-nums text-muted-foreground">
                            {toolT.characters_count.replace("{count}", String(exported.length))}
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Parsed variables table */}
                        <div className="h-1/2 overflow-auto border-b">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground w-8">#</th>
                                        <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">{toolT.key}</th>
                                        <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">{toolT.value}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsed.map((v, i) => {
                                        if (v.isEmpty) return null
                                        if (v.isComment) return (
                                            <tr key={i} className="text-muted-foreground/50">
                                                <td className="px-3 py-1 tabular-nums">{v.line}</td>
                                                <td colSpan={2} className="px-3 py-1 italic"># {v.comment}</td>
                                            </tr>
                                        )
                                        return (
                                            <tr
                                                key={i}
                                                className="border-t border-border/30 hover:bg-muted/20 cursor-pointer transition-colors"
                                                onClick={() => void handleCopyVariable(v.key, v.value)}
                                            >
                                                <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{v.line}</td>
                                                <td className="px-3 py-1.5 font-mono font-semibold text-primary">{v.key}</td>
                                                <td className="px-3 py-1.5 font-mono text-foreground max-w-[300px] truncate">{v.value}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Export output */}
                        <div className="h-1/2 overflow-auto">
                            <pre className="whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed text-green-400/90">{exported}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
