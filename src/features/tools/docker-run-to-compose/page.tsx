"use client"

import * as React from "react"
import { Copy, Zap } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    parseDockerRun,
    generateComposeService,
    serviceToYAML,
    inferServiceName,
} from "@/features/tools/docker-run-to-compose/utils"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DockerRunToComposePage() {
    const { t } = useLang()
    const toolT = t.tools["docker_run_to_compose"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [input, setInput] = React.useState("")
    const [output, setOutput] = React.useState("")
    const [warnings, setWarnings] = React.useState<string[]>([])

    const handleConvert = React.useCallback(() => {
        if (!input.trim()) {
            toast.error(t.common.input_required)
            return
        }

        try {
            const parseResult = parseDockerRun(input)
            const serviceName = inferServiceName(parseResult.options)
            const service = generateComposeService(parseResult.options)
            const yaml = serviceToYAML(serviceName, service)

            setOutput(yaml)
            setWarnings(parseResult.warnings)

            if (parseResult.warnings.length === 0) {
                toast.success(text("converted"))
            } else {
                toast.warning(text("converted_with_warnings"))
            }
        } catch (error) {
            toast.error(text("conversion_failed"))
            console.error(error)
        }
    }, [input, text, t.common.input_required])

    const handleCopy = React.useCallback(async () => {
        if (!output) return
        const success = await safeClipboardWrite(output)
        if (success) {
            toast.success(t.common.copied)
        } else {
            toast.error(t.common.copy_failed)
        }
    }, [output, t])

    const handleLoadExample = React.useCallback((example: string) => {
        setInput(example)
        setOutput("")
        setWarnings([])
    }, [])

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{text("title")}</h1>
                <p className="text-muted-foreground">{text("description")}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" size="sm" onClick={() => handleLoadExample('docker run -d --name redis -p 6379:6379 redis:7')}>
                    {text("example_redis")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleLoadExample('docker run --name pg -e POSTGRES_PASSWORD=secret -v pgdata:/var/lib/postgresql/data -p 5432:5432 postgres:16')}>
                    {text("example_postgres")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleLoadExample('docker run --rm -it -v "$PWD:/app" -w /app node:22 npm test')}>
                    {text("example_node")}
                </Button>
            </div>

            <div className="space-y-2">
                <Label className="font-semibold">{text("input_label")}</Label>
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={text("input_placeholder")}
                    className="min-h-[120px] font-mono text-sm"
                />
            </div>

            <Button onClick={handleConvert} className="w-full" size="lg">
                <Zap className="w-4 h-4 mr-2" />
                {text("convert_button")}
            </Button>

            {warnings.length > 0 && (
                <Alert>
                    <AlertDescription>
                        <div className="space-y-1">
                            <p className="font-semibold">{text("warnings_title")}:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                {warnings.map((warning, idx) => (
                                    <li key={idx}>{warning}</li>
                                ))}
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {output && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="font-semibold">{text("output_label")}</Label>
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                            <Copy className="w-4 h-4 mr-1" />
                            {t.common.copy}
                        </Button>
                    </div>
                    <Textarea value={output} readOnly className="min-h-[300px] font-mono text-sm bg-muted" />
                </div>
            )}
        </div>
    )
}
