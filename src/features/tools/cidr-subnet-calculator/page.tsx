"use client"

import * as React from "react"
import { Copy, Eraser, Network, Play, WandSparkles } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { calculateCidr, formatCidrSummary, type CidrCalculationResult } from "@/features/tools/cidr-subnet-calculator/utils"

const SAMPLE_CIDR = "192.168.1.42/24"

export function CidrSubnetCalculatorPage() {
    const { t } = useLang()
    const toolT = t.tools["cidr_subnet_calculator"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key], [toolT])

    const [input, setInput] = React.useState(SAMPLE_CIDR)
    const [result, setResult] = React.useState<CidrCalculationResult | null>(null)
    const [error, setError] = React.useState<string | null>(null)

    const runCalculation = React.useCallback((nextInput?: string) => {
        const target = typeof nextInput === "string" ? nextInput : input
        const parsed = calculateCidr(target)

        if (!parsed.ok) {
            setResult(null)
            setError(text("invalid_cidr"))
            return
        }

        setResult(parsed.value)
        setError(null)
    }, [input, text])

    React.useEffect(() => {
        runCalculation(SAMPLE_CIDR)
    }, [runCalculation])

    const handleCopySummary = React.useCallback(async () => {
        if (!result) return
        const summary = formatCidrSummary(result)
        const copyResult = await safeClipboardWrite(summary)
        if (!copyResult.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: text("copy_summary"),
        })
    }, [result, t.common, text])

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: text("sample_action"),
            icon: WandSparkles,
            onClick: () => {
                setInput(SAMPLE_CIDR)
                runCalculation(SAMPLE_CIDR)
            },
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: () => {
                setInput("")
                setResult(null)
                setError(null)
            },
        },
        {
            id: "calculate",
            label: text("calculate_action"),
            icon: Play,
            onClick: () => runCalculation(),
        },
        {
            id: "copy_output",
            label: t.common.copy,
            icon: Copy,
            disabled: !result,
            onClick: () => {
                void handleCopySummary()
            },
        },
    ]

    return (
        <div className="flex h-full flex-col">
            <div className="border-b px-4 py-3">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-primary" />
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">{toolT.title}</h1>
                            <p className="text-xs text-muted-foreground">
                                {toolT.description}
                            </p>
                        </div>
                    </div>
                    <ToolActionBar actions={actions} />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl space-y-4">
                    <section className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            {text("input_label")}
                        </label>
                        <input
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder={text("sample_cidr")}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") runCalculation()
                            }}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground">
                            {text("input_hint")}
                        </p>
                    </section>

                    {error ? (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </div>
                    ) : null}

                    {result ? (
                        <section className="rounded-xl border border-border/70 bg-card/50 p-4 md:p-5">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
                                    {result.input}
                                </span>
                                <span className="rounded-md border border-border/70 bg-background/60 px-2 py-1 text-xs text-muted-foreground">
                                    {text("total_addresses")}: {result.totalAddresses.toLocaleString()}
                                </span>
                                <span className="rounded-md border border-border/70 bg-background/60 px-2 py-1 text-xs text-muted-foreground">
                                    {text("usable_hosts")}: {result.usableHosts.toLocaleString()}
                                </span>
                            </div>
                            <dl className="grid gap-2 sm:grid-cols-2">
                                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
                                    <dt className="text-xs text-muted-foreground">{text("network_address")}</dt>
                                    <dd className="font-mono text-sm text-foreground">{result.networkAddress}</dd>
                                </div>
                                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
                                    <dt className="text-xs text-muted-foreground">{text("broadcast_address")}</dt>
                                    <dd className="font-mono text-sm text-foreground">{result.broadcastAddress}</dd>
                                </div>
                                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
                                    <dt className="text-xs text-muted-foreground">{text("first_host")}</dt>
                                    <dd className="font-mono text-sm text-foreground">{result.firstHost}</dd>
                                </div>
                                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
                                    <dt className="text-xs text-muted-foreground">{text("last_host")}</dt>
                                    <dd className="font-mono text-sm text-foreground">{result.lastHost}</dd>
                                </div>
                                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
                                    <dt className="text-xs text-muted-foreground">{text("subnet_mask")}</dt>
                                    <dd className="font-mono text-sm text-foreground">{result.subnetMask}</dd>
                                </div>
                                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
                                    <dt className="text-xs text-muted-foreground">{text("wildcard_mask")}</dt>
                                    <dd className="font-mono text-sm text-foreground">{result.wildcardMask}</dd>
                                </div>
                                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
                                    <dt className="text-xs text-muted-foreground">{text("private_range")}</dt>
                                    <dd className="text-sm text-foreground">
                                        {result.isPrivateRange ? text("yes") : text("no")}
                                    </dd>
                                </div>
                                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
                                    <dt className="text-xs text-muted-foreground">{text("address_class")}</dt>
                                    <dd className="text-sm text-foreground">{result.addressClass}</dd>
                                </div>
                            </dl>
                        </section>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
