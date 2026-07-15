"use client"

import * as React from "react"
import { Copy, MonitorSmartphone, Eraser } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { Textarea } from "@/components/ui/textarea"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { UAParser, IResult } from "ua-parser-js"
import { ToolPageContainer } from "@/components/layout/page-container"

export function UserAgentParserPage() {
    const { t } = useLang()
    const toolT = t.tools["user_agent_parser"] as Record<string, string>
    const [uaString, setUaString] = React.useState("")
    const [parsedData, setParsedData] = React.useState<IResult | null>(null)

    // On initial load, grab the user's actual user agent if available
    React.useEffect(() => {
        if (typeof window !== "undefined" && window.navigator && window.navigator.userAgent) {
            setUaString(window.navigator.userAgent)
        }
    }, [])

    // Parse dynamically
    React.useEffect(() => {
        if (!uaString.trim()) {
            setParsedData(null)
            return
        }

        try {
            const parser = new UAParser(uaString)
            setParsedData(parser.getResult())
        } catch {
            setParsedData(null)
        }
    }, [uaString])

    const handleCopy = async (text: string, label: string) => {
        if (!text) return
        const result = await safeClipboardWrite(text)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: toolT.copy_success_description.replace("{label}", label),
        })
    }

    const handleClear = () => {
        setUaString("")
    }

    const handleUseMyBrowser = () => {
        if (typeof window !== "undefined" && window.navigator) {
            setUaString(window.navigator.userAgent)
        }
    }

    return (
        <ToolPageContainer className="flex flex-col h-full space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <MonitorSmartphone className="h-6 w-6 text-primary" />
                        {t.tools['user_agent_parser'].title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t.tools['user_agent_parser'].description}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleClear}>
                        <Eraser className="mr-2 h-4 w-4" />{t.common.clear}</Button>
                    <Button size="sm" onClick={handleUseMyBrowser}>
                        {toolT.detect_my_browser_action}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">

                {/* Input Textarea */}
                <div className="md:col-span-12 flex flex-col border rounded-xl bg-card shadow-sm overflow-hidden">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.raw_user_agent_label}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => void handleCopy(uaString, toolT.user_agent_label)}
                            aria-label={t.common.copy_output}
                        >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">{t.common.copy_output}</span>
                        </Button>
                    </div>
                    <Textarea
                        className="flex-1 min-h-[120px] resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 p-4 font-mono text-sm leading-relaxed"
                        placeholder={toolT.input_placeholder}
                        value={uaString}
                        onChange={(e) => setUaString(e.target.value)}
                        spellCheck={false}
                    />
                </div>

                {/* Output Parsed Data */}
                <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                    {!parsedData ? (
                        <div className="col-span-full h-32 border border-dashed rounded-lg flex items-center justify-center text-muted-foreground bg-muted/10">
                            {toolT.empty_state}
                        </div>
                    ) : (
                        <>
                            <DataCard
                                title={toolT.browser_card_title}
                                emptyStateText={toolT.no_data}
                                data={{
                                    [toolT.name_label]: parsedData.browser.name,
                                    [toolT.version_label]: parsedData.browser.version,
                                    [toolT.major_label]: parsedData.browser.major,
                                }}
                            />

                            <DataCard
                                title={toolT.os_card_title}
                                emptyStateText={toolT.no_data}
                                data={{
                                    [toolT.name_label]: parsedData.os.name,
                                    [toolT.version_label]: parsedData.os.version,
                                }}
                            />

                            <DataCard
                                title={toolT.device_cpu_card_title}
                                emptyStateText={toolT.no_data}
                                data={{
                                    [toolT.vendor_label]: parsedData.device.vendor,
                                    [toolT.model_label]: parsedData.device.model,
                                    [toolT.type_label]: parsedData.device.type || (parsedData.device.vendor ? toolT.unknown_label : ""),
                                    [toolT.architecture_label]: parsedData.cpu.architecture,
                                }}
                            />

                            <DataCard
                                title={toolT.engine_card_title}
                                emptyStateText={toolT.no_data}
                                className="md:col-span-2 lg:col-span-3"
                                data={{
                                    [toolT.name_label]: parsedData.engine.name,
                                    [toolT.version_label]: parsedData.engine.version,
                                }}
                            />
                        </>
                    )}

                </div>

            </div>
        </ToolPageContainer>
    )
}

function DataCard({
    title,
    data,
    emptyStateText,
    className = "",
}: {
    title: string
    data: Record<string, string | undefined>
    emptyStateText: string
    className?: string
}) {
    const hasData = Object.values(data).some(val => !!val)

    return (
        <div className={`p-5 pl-6 border rounded-xl bg-card shadow-sm space-y-4 ${className}`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>

            {hasData ? (
                <dl className="space-y-3">
                    {Object.entries(data).map(([key, value]) => {
                        if (!value) return null
                        return (
                            <div key={key} className="flex flex-col">
                                <dt className="text-[11px] font-medium text-muted-foreground uppercase">{key}</dt>
                                <dd className="text-sm font-mono text-foreground mt-0.5">{value}</dd>
                            </div>
                        )
                    })}
                </dl>
            ) : (
                <div className="text-sm text-muted-foreground/60 italic">{emptyStateText}</div>
            )}
        </div>
    )
}
