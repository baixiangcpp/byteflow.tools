"use client"

import * as React from "react"
import { Copy, FileText, Search } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { PHASE4_LIMITS } from "@/core/utils/phase4-inspector-limits"
import { inspectUnicode, type UnicodeInspectionResult } from "@/features/tools/unicode-inspector/utils"
import { WideToolPageContainer } from "@/components/layout/page-container"

export function UnicodeInspectorPage() {
    const { t } = useLang()
    const toolT = t.tools["unicode_inspector"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [input, setInput] = React.useState("")
    const result = React.useMemo<UnicodeInspectionResult>(() => inspectUnicode(input), [input])

    const copyJson = React.useCallback(async () => {
        const copied = await safeClipboardWrite(JSON.stringify(result.characters, null, 2))
        if (!copied.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }, [result, t.common.copy_failed, t.common.copied])

    const loadExample = React.useCallback(() => {
        setInput("admin\u200B@example.com\nA\u0301 B\u00A0C 你好 🔒")
    }, [])

    return (
        <WideToolPageContainer className="flex flex-col gap-6 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Search className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{text("description")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={loadExample}><FileText className="mr-2 h-4 w-4" />{t.common.try_example}</Button>
                    <Button variant="outline" size="sm" onClick={() => void copyJson()} disabled={result.characters.length === 0}><Copy className="mr-2 h-4 w-4" />{text("copy_json")}</Button>
                </div>
            </div>

            {result.truncated ? <Alert><AlertDescription>{text("truncated_warning")}</AlertDescription></Alert> : null}

            <section className="space-y-2">
                <Label htmlFor="unicode-input">{text("input_label")}</Label>
                <Textarea
                    id="unicode-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={text("input_placeholder")}
                    className="min-h-[220px] font-mono text-sm"
                    spellCheck={false}
                />
            </section>

            <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-8">
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("code_points")}</div><div className="text-2xl font-bold">{result.stats.codePoints}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("utf16_units")}</div><div className="text-2xl font-bold">{result.stats.utf16Units}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("bytes")}</div><div className="text-2xl font-bold">{result.stats.bytes}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("lines")}</div><div className="text-2xl font-bold">{result.stats.lines}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("combining")}</div><div className="text-2xl font-bold">{result.stats.combiningMarks}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("controls")}</div><div className="text-2xl font-bold">{result.stats.controls}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("invisible")}</div><div className="text-2xl font-bold">{result.stats.invisible}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{text("non_ascii")}</div><div className="text-2xl font-bold">{result.stats.nonAscii}</div></div>
            </div>

            <div className="overflow-hidden rounded-lg border">
                <div className="border-b bg-muted px-4 py-2 text-sm font-semibold">{text("characters")}</div>
                <div className="max-h-[560px] overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background">
                            <tr className="border-b">
                                <th className="px-4 py-2 text-left">#</th>
                                <th className="px-4 py-2 text-left">{text("char")}</th>
                                <th className="px-4 py-2 text-left">{text("code_point")}</th>
                                <th className="px-4 py-2 text-left">{text("name")}</th>
                                <th className="px-4 py-2 text-left">{text("category")}</th>
                                <th className="px-4 py-2 text-left">UTF-8</th>
                                <th className="px-4 py-2 text-left">{text("flags")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.characters.slice(0, PHASE4_LIMITS.maxUnicodeRenderedCharacters).map((char) => (
                                <tr key={`${char.index}-${char.codePoint}`} className="border-b last:border-b-0">
                                    <td className="px-4 py-2 font-mono text-xs">{char.index}</td>
                                    <td className="px-4 py-2 font-mono text-xs">{char.character === "\n" ? "\\n" : char.character === "\r" ? "\\r" : char.character === "\t" ? "\\t" : char.character}</td>
                                    <td className="px-4 py-2 font-mono text-xs">{char.codePoint}</td>
                                    <td className="px-4 py-2">{char.name}</td>
                                    <td className="px-4 py-2">{char.category}</td>
                                    <td className="px-4 py-2 font-mono text-xs">{char.utf8Bytes.join(" ")}</td>
                                    <td className="px-4 py-2 text-xs">{char.flags.join(", ") || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </WideToolPageContainer>
    )
}
