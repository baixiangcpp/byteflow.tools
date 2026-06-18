"use client"

import * as React from "react"
import { Binary, Copy, RotateCcw, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { convertBaseEncoding, type BaseEncoding } from "./utils"

type Operation = "encode" | "decode"

const SAMPLE_BY_ENCODING: Record<BaseEncoding, { plain: string; encoded: string }> = {
    base32: { plain: "byteflow tools", encoded: "MJ4XI2DGN5XWIZLTMF2A====" },
    base58: { plain: "Hello World!", encoded: "2NEpo7TZRRrLZSi2U" },
}

export function BaseEncodingConverterPage() {
    const { t } = useLang()
    const toolT = t.tools["base_encoding_converter"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key], [toolT])
    const [encoding, setEncoding] = React.useState<BaseEncoding>("base32")
    const [operation, setOperation] = React.useState<Operation>("encode")
    const [input, setInput] = React.useState(SAMPLE_BY_ENCODING.base32.plain)
    const [output, setOutput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)

    const run = React.useCallback(() => {
        try {
            setOutput(convertBaseEncoding(input, encoding, operation))
            setError(null)
        } catch {
            setOutput("")
            setError(encoding === "base32" ? text("invalid_base32") : text("invalid_base58"))
        }
    }, [encoding, input, operation, text])

    const useSample = () => {
        const sample = SAMPLE_BY_ENCODING[encoding]
        setInput(operation === "encode" ? sample.plain : sample.encoded)
        setOutput("")
        setError(null)
    }

    const reset = () => {
        setInput("")
        setOutput("")
        setError(null)
    }

    const copyOutput = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, { description: t.common.copied_desc })
    }

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                    <Binary className="h-6 w-6 text-primary" />
                    {toolT.title}
                </h1>
                <p className="mt-1 text-muted-foreground">{toolT.description}</p>
            </div>

            <div className="grid gap-3 rounded-lg border border-border/70 bg-card/40 p-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-xs font-medium uppercase text-muted-foreground">{text("encoding_label")}</label>
                    <div className="inline-flex rounded-lg border border-border/70 bg-background/60 p-1">
                        {(["base32", "base58"] as BaseEncoding[]).map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => {
                                    setEncoding(item)
                                    setOutput("")
                                    setError(null)
                                }}
                                className={`rounded-md px-4 py-2 text-sm font-semibold ${encoding === item ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                            >
                                {item.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="mb-2 block text-xs font-medium uppercase text-muted-foreground">{text("operation_label")}</label>
                    <div className="inline-flex rounded-lg border border-border/70 bg-background/60 p-1">
                        {(["encode", "decode"] as Operation[]).map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => {
                                    setOperation(item)
                                    setOutput("")
                                    setError(null)
                                }}
                                className={`rounded-md px-4 py-2 text-sm font-semibold ${operation === item ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                            >
                                {item === "encode" ? text("encode") : text("decode")}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={run}>{text("convert")}</Button>
                <Button variant="outline" size="sm" onClick={useSample}>
                    <TestTube2 className="h-4 w-4" />
                    {t.common.sample}
                </Button>
                <Button variant="outline" size="sm" onClick={reset}>
                    <RotateCcw className="h-4 w-4" />
                    {t.common.reset}
                </Button>
                <Button variant="outline" size="sm" onClick={() => void copyOutput()} disabled={!output}>
                    <Copy className="h-4 w-4" />
                    {t.common.copy}
                </Button>
            </div>

            {error ? <div className="rounded-md bg-destructive/90 p-3 text-sm font-medium text-destructive-foreground">{error}</div> : null}

            <div className="grid flex-1 gap-4 lg:grid-cols-2">
                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{t.common.input}</div>
                    <Textarea
                        className="h-full min-h-[360px] resize-none border-0 p-4 font-mono text-sm"
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        spellCheck={false}
                    />
                </div>
                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{t.common.output}</div>
                    <Textarea
                        className="h-full min-h-[360px] resize-none border-0 p-4 font-mono text-sm"
                        value={output}
                        readOnly
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    )
}
