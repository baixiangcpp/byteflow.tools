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

type OutputLang = "javascript" | "python" | "go" | "php" | "rust"

interface ParsedRequest {
    method: string
    url: string
    headers: Record<string, string>
    data: string
    dataType: "raw" | "json" | "form"
}

function parseCurl(curlStr: string): ParsedRequest | null {
    try {
        const result: ParsedRequest = { method: "GET", url: "", headers: {}, data: "", dataType: "raw" }

        // Normalize multiline
        const normalized = curlStr.replace(/\\\n\s*/g, " ").replace(/\\\r?\n\s*/g, " ").trim()

        // Remove 'curl' prefix
        const rest = normalized.replace(/^curl\s+/, "")

        // Extract URL (first unquoted token that looks like a URL, or quoted string after method)
        const urlMatch = rest.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/)
        if (urlMatch) {
            result.url = urlMatch[1]
        }

        // Extract method
        const methodMatch = rest.match(/-X\s+['"]?(\w+)['"]?/i)
        if (methodMatch) {
            result.method = methodMatch[1].toUpperCase()
        }

        // Extract headers
        const headerRegex = /-H\s+['"]([^'"]+)['"]/g
        let hMatch
        while ((hMatch = headerRegex.exec(rest)) !== null) {
            const colonIdx = hMatch[1].indexOf(":")
            if (colonIdx > 0) {
                const key = hMatch[1].slice(0, colonIdx).trim()
                const value = hMatch[1].slice(colonIdx + 1).trim()
                result.headers[key] = value
            }
        }

        // Extract data
        const dataMatch = rest.match(/(?:-d|--data|--data-raw|--data-binary)\s+['"]([^'"]*)['"]/i) ||
            rest.match(/(?:-d|--data|--data-raw|--data-binary)\s+(\S+)/i)
        if (dataMatch) {
            result.data = dataMatch[1]
            if (result.method === "GET") result.method = "POST"

            // Detect type
            try {
                JSON.parse(result.data)
                result.dataType = "json"
            } catch {
                if (result.data.includes("=") && !result.data.includes("{")) {
                    result.dataType = "form"
                }
            }
        }

        if (!result.url) return null
        return result
    } catch {
        return null
    }
}

function toJavaScript(req: ParsedRequest): string {
    const lines: string[] = []
    const hasHeaders = Object.keys(req.headers).length > 0
    const hasBody = !!req.data

    lines.push(`const response = await fetch('${req.url}', {`)
    lines.push(`  method: '${req.method}',`)
    if (hasHeaders) {
        lines.push(`  headers: {`)
        for (const [k, v] of Object.entries(req.headers)) {
            lines.push(`    '${k}': '${v}',`)
        }
        lines.push(`  },`)
    }
    if (hasBody) {
        if (req.dataType === "json") {
            lines.push(`  body: JSON.stringify(${req.data}),`)
        } else {
            lines.push(`  body: '${req.data}',`)
        }
    }
    lines.push(`});`)
    lines.push(``)
    lines.push(`const data = await response.json();`)
    lines.push(`console.log(data);`)
    return lines.join("\n")
}

function toPython(req: ParsedRequest): string {
    const lines: string[] = ["import requests", ""]
    const hasHeaders = Object.keys(req.headers).length > 0
    const m = req.method.toLowerCase()

    if (hasHeaders) {
        lines.push(`headers = ${JSON.stringify(req.headers, null, 4)}`)
        lines.push("")
    }

    let args = `'${req.url}'`
    if (hasHeaders) args += ", headers=headers"
    if (req.data) {
        if (req.dataType === "json") {
            lines.push(`payload = ${req.data}`)
            args += ", json=payload"
        } else {
            lines.push(`data = '${req.data}'`)
            args += ", data=data"
        }
        lines.push("")
    }

    lines.push(`response = requests.${m}(${args})`)
    lines.push(`print(response.status_code)`)
    lines.push(`print(response.json())`)
    return lines.join("\n")
}

function toGo(req: ParsedRequest): string {
    const lines: string[] = [
        'package main', '', 'import (', '    "fmt"', '    "io"', '    "net/http"',
    ]
    if (req.data) lines.push('    "strings"')
    lines.push(')', '')
    lines.push('func main() {')

    if (req.data) {
        lines.push(`    body := strings.NewReader(\`${req.data}\`)`)
        lines.push(`    req, err := http.NewRequest("${req.method}", "${req.url}", body)`)
    } else {
        lines.push(`    req, err := http.NewRequest("${req.method}", "${req.url}", nil)`)
    }
    lines.push('    if err != nil { panic(err) }')

    for (const [k, v] of Object.entries(req.headers)) {
        lines.push(`    req.Header.Set("${k}", "${v}")`)
    }

    lines.push('    resp, err := http.DefaultClient.Do(req)')
    lines.push('    if err != nil { panic(err) }')
    lines.push('    defer resp.Body.Close()')
    lines.push('    data, _ := io.ReadAll(resp.Body)')
    lines.push('    fmt.Println(string(data))')
    lines.push('}')
    return lines.join("\n")
}

function toPhp(req: ParsedRequest): string {
    const lines: string[] = ["<?php", "", "$ch = curl_init();", ""]
    lines.push(`curl_setopt($ch, CURLOPT_URL, '${req.url}');`)
    lines.push(`curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);`)
    if (req.method !== "GET") {
        lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${req.method}');`)
    }
    if (req.data) {
        lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${req.data}');`)
    }
    const headerEntries = Object.entries(req.headers)
    if (headerEntries.length > 0) {
        lines.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, [`)
        for (const [k, v] of headerEntries) {
            lines.push(`    '${k}: ${v}',`)
        }
        lines.push(`]);`)
    }
    lines.push("")
    lines.push("$response = curl_exec($ch);")
    lines.push("curl_close($ch);")
    lines.push("echo $response;")
    return lines.join("\n")
}

function toRust(req: ParsedRequest): string {
    const lines: string[] = [
        'use reqwest;', '', '#[tokio::main]', 'async fn main() -> Result<(), Box<dyn std::error::Error>> {',
        '    let client = reqwest::Client::new();', '',
    ]
    const m = req.method.toLowerCase()
    lines.push(`    let response = client.${m}("${req.url}")`)
    for (const [k, v] of Object.entries(req.headers)) {
        lines.push(`        .header("${k}", "${v}")`)
    }
    if (req.data) {
        lines.push(`        .body(r#"${req.data}"#)`)
    }
    lines.push(`        .send()`)
    lines.push(`        .await?;`)
    lines.push('')
    lines.push('    println!("{}", response.text().await?);')
    lines.push('    Ok(())')
    lines.push('}')
    return lines.join("\n")
}

function convert(curl: string, lang: OutputLang, parseError: string): string {
    if (!curl.trim()) return ""
    const parsed = parseCurl(curl)
    if (!parsed) return parseError
    switch (lang) {
        case "javascript": return toJavaScript(parsed)
        case "python": return toPython(parsed)
        case "go": return toGo(parsed)
        case "php": return toPhp(parsed)
        case "rust": return toRust(parsed)
    }
}

const SAMPLE_CURL = `curl -X POST 'https://api.example.com/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"id": 42, "enabled": true}'`

export function CurlToCodePage() {
    const { t } = useLang()
    const toolT = t.tools["curl_to_code"] as Record<string, string>
    const [curl, setCurl] = React.useState(SAMPLE_CURL)
    const [lang, setLang] = React.useState<OutputLang>("javascript")
    const output = React.useMemo(() => convert(curl, lang, toolT.parse_error), [curl, lang, toolT.parse_error])

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
