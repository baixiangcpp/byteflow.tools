"use client"

import * as React from "react"
import { Braces, Copy, Eraser, Play, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { inspectGraphql } from "./logic"
import { SAMPLE_INPUT, SAMPLE_INTROSPECTION, SAMPLE_VARIABLES } from "./samples"

export function GraphqlWorkbenchPage() {
    const { t } = useLang()
    const toolT = t.tools["graphql_workbench"] as Record<string, string>
    const [query, setQuery] = React.useState(SAMPLE_INPUT)
    const [variables, setVariables] = React.useState(SAMPLE_VARIABLES)
    const [introspection, setIntrospection] = React.useState(SAMPLE_INTROSPECTION)
    const [output, setOutput] = React.useState("")
    const [diagnostics, setDiagnostics] = React.useState<string[]>([])

    const run = React.useCallback(() => {
        const result = inspectGraphql(query, variables, introspection)
        setOutput(result.formattedQuery)
        setDiagnostics([
            `${toolT.operation_label}: ${result.operationName ? `${result.operationType} ${result.operationName}` : result.operationType}`,
            result.variablesSummary,
            ...result.diagnostics.map((diagnostic) => `${diagnostic.line}:${diagnostic.column} ${diagnostic.message} ${diagnostic.fix}`),
            ...result.introspectionTypes.map((entry) => `${toolT.schema_type_label}: ${entry}`),
        ])
    }, [introspection, query, toolT.operation_label, toolT.schema_type_label, variables])

    const copyOutput = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const loadSample = () => {
        setQuery(SAMPLE_INPUT)
        setVariables(SAMPLE_VARIABLES)
        setIntrospection(SAMPLE_INTROSPECTION)
        setOutput("")
        setDiagnostics([])
    }

    const clear = () => {
        setQuery("")
        setVariables("")
        setIntrospection("")
        setOutput("")
        setDiagnostics([])
    }

    const actions: ToolAction[] = [
        { id: "run", label: toolT.format_action, icon: Play, onClick: run, variant: "default", disabled: !query.trim() },
        { id: "copy", label: t.common.copy, icon: Copy, onClick: copyOutput, disabled: !output },
        { id: "sample", label: t.common.sample, icon: RotateCcw, onClick: loadSample },
        { id: "clear", label: t.common.clear, icon: Eraser, onClick: clear },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <Braces className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{toolT.description}</p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <SensitiveInputWarning />

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{toolT.query_label}</div>
                    <Textarea className="h-full min-h-[460px] resize-none border-0 p-4 font-mono text-xs leading-5" value={query} onChange={(event) => setQuery(event.target.value)} spellCheck={false} />
                </section>
                <div className="grid gap-4">
                    <section className="flex min-h-[250px] flex-col overflow-hidden rounded-lg border bg-card">
                        <div className="tool-pane-header">{toolT.variables_label}</div>
                        <Textarea className="h-full min-h-[190px] resize-none border-0 p-4 font-mono text-xs leading-5" value={variables} onChange={(event) => setVariables(event.target.value)} spellCheck={false} />
                    </section>
                    <section className="flex min-h-[250px] flex-col overflow-hidden rounded-lg border bg-card">
                        <div className="tool-pane-header">{toolT.introspection_label}</div>
                        <Textarea className="h-full min-h-[190px] resize-none border-0 p-4 font-mono text-xs leading-5" value={introspection} onChange={(event) => setIntrospection(event.target.value)} spellCheck={false} />
                    </section>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="flex min-h-[300px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{toolT.formatted_label}</div>
                    <Textarea className="h-full min-h-[240px] resize-none border-0 bg-muted/30 p-4 font-mono text-xs leading-5" value={output} readOnly spellCheck={false} />
                </section>
                <section className="rounded-lg border bg-card p-4">
                    <h2 className="text-sm font-semibold uppercase text-muted-foreground">{toolT.diagnostics_label}</h2>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {diagnostics.length > 0 ? diagnostics.map((entry) => <li key={entry}>{entry}</li>) : <li>{t.common.preview_will_appear_here}</li>}
                    </ul>
                </section>
            </div>

            <RelatedTools toolKey="graphql_workbench" />
        </div>
    )
}
