"use client"

import * as React from "react"
import { Copy, Eraser, Terminal, ArrowRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { copyTextWithToolFeedback } from "@/features/tool-shell/tool-action-feedback"
import { TextOutputPanel } from "@/features/tool-shell/text-output-panel"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    convertCurlToCodeResult,
    type CurlDiagnostic,
    type CurlDiagnosticCode,
    type OutputLang,
} from "./logic"
import { WideToolPageContainer } from "@/components/layout/page-container"

const SAMPLE_CURL = `curl -X POST 'https://api.example.com/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"id": 42, "enabled": true}'`

const DIAGNOSTIC_TRANSLATION_KEYS: Record<CurlDiagnosticCode, string> = {
    empty_command: "diagnostic_invalid_command",
    expected_curl: "diagnostic_invalid_command",
    unterminated_quote: "diagnostic_unterminated_quote",
    dangling_escape: "diagnostic_dangling_escape",
    unsupported_operator: "diagnostic_unsupported_operator",
    unsupported_option: "diagnostic_unsupported_option",
    missing_option_value: "diagnostic_missing_option_value",
    invalid_method: "diagnostic_invalid_value",
    invalid_header: "diagnostic_invalid_value",
    invalid_url: "diagnostic_invalid_value",
    missing_url: "diagnostic_invalid_command",
    multiple_urls: "diagnostic_unexpected_argument",
    unexpected_argument: "diagnostic_unexpected_argument",
    unsupported_data_file: "diagnostic_unsupported_data_file",
    duplicate_header: "diagnostic_duplicate_header",
}

function formatDiagnostic(diagnostic: CurlDiagnostic, toolT: Record<string, string>): string {
    const key = DIAGNOSTIC_TRANSLATION_KEYS[diagnostic.code]
    const template = toolT[key] || toolT.parse_error
    const rawToken = diagnostic.token || ""
    const clippedToken = rawToken.length > 120 ? `${rawToken.slice(0, 117)}...` : rawToken
    const token = JSON.stringify(clippedToken)
    const message = template.replaceAll("{token}", token)
    const position = (toolT.diagnostic_position || "Character {position}")
        .replace("{position}", String(diagnostic.position))
    return `${message} ${position}`
}

export function CurlToCodePage() {
    const { t } = useLang()
    const toolT = t.tools["curl_to_code"] as Record<string, string>
    const [curl, setCurl] = React.useState(SAMPLE_CURL)
    const [lang, setLang] = React.useState<OutputLang>("javascript")
    const conversion = React.useMemo(() => convertCurlToCodeResult(curl, lang), [curl, lang])
    const output = conversion.code
    const errors = conversion.diagnostics.filter((item) => item.severity === "error")
    const warnings = conversion.diagnostics.filter((item) => item.severity === "warning")

    const handleCopy = async () => {
        return copyTextWithToolFeedback(t, output, `${toolT.output_label || "Code"} (${lang})`)
    }

    const actions: ToolAction[] = [
        { id: "clear", label: t.common.clear, icon: Eraser, onClick: () => setCurl(""), destructive: true },
        {
            id: "copy",
            label: t.common.copy,
            icon: Copy,
            onClick: handleCopy,
            disabled: !output,
            disabledReason: t.common.action_disabled_no_output,
        },
    ]

    return (
        <WideToolPageContainer className="flex flex-col h-full space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Terminal className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            {errors.length > 0 && (
                <Alert variant="destructive">
                    <AlertDescription>
                        <p className="font-medium">{toolT.parse_error}</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-xs">
                            {errors.map((item, index) => (
                                <li key={`${item.code}-${item.position}-${index}`}>{formatDiagnostic(item, toolT)}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {warnings.length > 0 && (
                <Alert role="status">
                    <AlertDescription>
                        <p className="font-medium">{toolT.parse_warning}</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-xs">
                            {warnings.map((item, index) => (
                                <li key={`${item.code}-${item.position}-${index}`}>{formatDiagnostic(item, toolT)}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[500px]">
                {/* cURL Input */}
                <div className="flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div className="tool-pane-header">{toolT.input_label}</div>
                    <Textarea
                        className="flex-1 min-h-[400px] resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 font-mono text-sm leading-6 p-4"
                        value={curl}
                        onChange={(e) => setCurl(e.target.value)}
                        placeholder="curl -X GET https://api.example.com"
                        spellCheck={false}
                    />
                </div>

                {/* Code Output */}
                <TextOutputPanel
                    title={toolT.output_label || t.common.output}
                    value={output}
                    ariaLabel={toolT.output_label || t.common.output}
                    minHeightClassName="min-h-[400px]"
                    defaultMode="scroll"
                    actions={(
                        <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                            <Select value={lang} onValueChange={(v) => setLang(v as OutputLang)}>
                                <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="javascript">JavaScript</SelectItem>
                                    <SelectItem value="python">Python</SelectItem>
                                    <SelectItem value="go">Go</SelectItem>
                                    <SelectItem value="php">PHP</SelectItem>
                                    <SelectItem value="rust">Rust</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                />
            </div>

            <RelatedTools toolKey="curl_to_code" />
        </WideToolPageContainer>
    )
}
