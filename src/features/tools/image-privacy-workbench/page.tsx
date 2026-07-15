"use client"

import * as React from "react"
import { Download, Eraser, ImageOff, RotateCcw, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { createLocalObjectUrl, downloadObjectUrl, revokeLocalObjectUrl, stripImageMetadata } from "./browser-actions"
import { formatMetadataScan } from "./logic"
import { ToolPageContainer } from "@/components/layout/page-container"

export function ImagePrivacyWorkbenchPage() {
    const { t } = useLang()
    const toolT = t.tools["image_privacy_workbench"] as Record<string, string>
    const fileRef = React.useRef<HTMLInputElement>(null)
    const objectUrlRef = React.useRef<string>("")
    const [fileName, setFileName] = React.useState("")
    const [outputUrl, setOutputUrl] = React.useState("")
    const [report, setReport] = React.useState("")
    const [isRunning, setIsRunning] = React.useState(false)
    const workflowSteps = [
        { title: toolT.step_redact_title, detail: toolT.step_redact_detail },
        { title: toolT.step_strip_title, detail: toolT.step_strip_detail },
        { title: toolT.step_inspect_title, detail: toolT.step_inspect_detail },
    ]

    React.useEffect(() => () => {
        if (objectUrlRef.current) revokeLocalObjectUrl(objectUrlRef.current)
    }, [])

    const processFile = async (file: File) => {
        setIsRunning(true)
        try {
            const result = await stripImageMetadata(file, "image/png")
            if (objectUrlRef.current) revokeLocalObjectUrl(objectUrlRef.current)
            const nextUrl = createLocalObjectUrl(result.blob)
            objectUrlRef.current = nextUrl
            setOutputUrl(nextUrl)
            setFileName(file.name)
            setReport([
                `${toolT.dimensions_label}: ${result.width} x ${result.height}`,
                "",
                toolT.before_label,
                formatMetadataScan(result.before),
                "",
                toolT.after_label,
                formatMetadataScan(result.after),
            ].join("\n"))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : String(error))
        } finally {
            setIsRunning(false)
        }
    }

    const reset = () => {
        setFileName("")
        setReport("")
        setOutputUrl("")
        if (objectUrlRef.current) revokeLocalObjectUrl(objectUrlRef.current)
        objectUrlRef.current = ""
        if (fileRef.current) fileRef.current.value = ""
    }

    const download = () => {
        if (!outputUrl) return
        downloadObjectUrl(outputUrl, "metadata-stripped-image.png")
    }

    const actions: ToolAction[] = [
        { id: "upload", label: toolT.choose_image_action, icon: Upload, onClick: () => fileRef.current?.click(), variant: "default", disabled: isRunning },
        { id: "download", label: t.common.download, icon: Download, onClick: download, disabled: !outputUrl },
        { id: "reset", label: t.common.reset, icon: Eraser, onClick: reset },
    ]

    return (
        <ToolPageContainer className="flex h-full flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <ImageOff className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{toolT.description}</p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <SensitiveInputWarning />

            <Input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void processFile(file)
                }}
            />

            <section className="rounded-lg border bg-card p-4">
                <h2 className="text-sm font-semibold uppercase text-muted-foreground">{toolT.workflow_label}</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {workflowSteps.map((step, index) => (
                        <div key={step.title} className="rounded-md border border-border/70 bg-background p-3">
                            <p className="text-xs font-semibold text-muted-foreground">{index + 1}</p>
                            <h3 className="mt-1 font-medium text-foreground">{step.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-lg border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="font-medium text-foreground">{toolT.upload_label}</h2>
                            <p className="text-sm text-muted-foreground">{fileName || toolT.no_file_label}</p>
                        </div>
                        <Button onClick={() => fileRef.current?.click()} disabled={isRunning}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {toolT.choose_image_action}
                        </Button>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element -- Object URLs from local files are not compatible with next/image optimization. */}
                    {outputUrl ? <img src={outputUrl} alt={toolT.preview_alt} className="mt-4 max-h-[420px] w-full rounded-md border object-contain" /> : null}
                </section>
                <section className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border bg-card">
                    <div className="tool-pane-header">{toolT.report_label}</div>
                    <pre className="h-full min-h-[360px] overflow-auto whitespace-pre-wrap bg-muted/30 p-4 font-mono text-xs leading-5 text-foreground">{report || t.common.preview_will_appear_here}</pre>
                </section>
            </div>

            <RelatedTools toolKey="image_privacy_workbench" />
        </ToolPageContainer>
    )
}
