"use client"

import * as React from "react"
import { Copy, Eraser, Terminal, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { convertCurlToCode, type OutputLang } from "./logic"

const SAMPLE_CURL = `curl -X POST 'https://api.example.com/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"id": 42, "enabled": true}'`

export function CurlToCodePage() {
    const { t } = useLang()
    const toolT = t.tools["curl_to_code"] as Record<string, string>
    const [curl, setCurl] = React.useState(SAMPLE_CURL)
    const [lang, setLang] = React.useState<OutputLang>("javascript")
    const output = React.useMemo(() => convertCurlToCode(curl, lang, toolT.parse_error), [curl, lang, toolT.parse_error])

    const handleCopy = async () => {
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    return (
        <div className="flex flex-col h-full space-y-6 max-w-[1400px] mx-auto w-full">
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
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setCurl(""); }}>
                        <Eraser className="mr-2 h-4 w-4" />{t.common.clear}
                    </Button>
                </div>
            </div>

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
                <div className="flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div className="tool-pane-header tool-pane-header-between">
                        <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <Select value={lang} onValueChange={(v) => setLang(v as OutputLang)}>
                                <SelectTrigger className="w-36 h-7"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="javascript">JavaScript</SelectItem>
                                    <SelectItem value="python">Python</SelectItem>
                                    <SelectItem value="go">Go</SelectItem>
                                    <SelectItem value="php">PHP</SelectItem>
                                    <SelectItem value="rust">Rust</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7" onClick={() => void handleCopy()}>
                            <Copy className="mr-2 h-4 w-4" />{t.common.copy}
                        </Button>
                    </div>
                    <pre className="flex-1 min-h-[400px] p-4 font-mono text-sm leading-6 overflow-auto whitespace-pre-wrap select-all">
                        {output}
                    </pre>
                </div>
            </div>

            <RelatedTools toolKey="curl_to_code" />
        </div>
    )
}
