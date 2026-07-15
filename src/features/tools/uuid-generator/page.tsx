"use client"

import * as React from "react"
import { Copy, Download, Hash, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { serializeSpreadsheetSafeCsv } from "@/core/files/csv-export"
import { v1 as uuidv1, v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { downloadTextFile } from "./browser-actions"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const PAGE_SIZE_OPTIONS = [50, 100, 250]
type ExportFormat = "txt" | "csv" | "json"

export function UuidGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["uuid_generator"] as Record<string, string>
    const [uuids, setUuids] = React.useState<string[]>([])
    const [quantity, setQuantity] = React.useState(5)
    const [version, setVersion] = React.useState("v4")
    const [caseFormat, setCaseFormat] = React.useState("lowercase")
    const [hyphens, setHyphens] = React.useState("yes")
    const [prefix, setPrefix] = React.useState("")
    const [suffix, setSuffix] = React.useState("")
    const [pageSize, setPageSize] = React.useState(100)
    const [pageIndex, setPageIndex] = React.useState(0)

    const formattedUuids = React.useMemo(
        () => uuids.map((id) => `${prefix}${id}${suffix}`),
        [prefix, suffix, uuids],
    )
    const totalPages = Math.max(1, Math.ceil(formattedUuids.length / pageSize))
    const safePageIndex = Math.min(pageIndex, totalPages - 1)
    const visibleUuids = formattedUuids.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize)
    const previewValue = formattedUuids[0] ?? `${prefix}xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx${suffix}`

    const generateUuids = React.useCallback(() => {
        const qty = Math.min(Math.max(1, quantity), 1000) // limit between 1 and 1000
        const newUuids = Array.from({ length: qty }, () => {
            let id = version === "v1" ? uuidv1() : uuidv4()

            if (hyphens === "no") {
                id = id.replace(/-/g, "")
            }

            if (caseFormat === "uppercase") {
                id = id.toUpperCase()
            }

            return id
        })

        setUuids(newUuids)
        setPageIndex(0)
    }, [quantity, version, caseFormat, hyphens])

    // Initial generation
    React.useEffect(() => {
        generateUuids()
    }, [generateUuids])

    const handleCopyAll = async () => {
        if (formattedUuids.length === 0) return
        const result = await safeClipboardWrite(formattedUuids.join("\n"))
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: toolT.copied_desc.replace("{count}", String(formattedUuids.length)),
        })
    }

    const handleDownload = (format: ExportFormat) => {
        if (formattedUuids.length === 0) return
        if (format === "json") {
            downloadTextFile(JSON.stringify(formattedUuids, null, 2), "byteflow-uuids.json", "application/json;charset=utf-8")
        } else if (format === "csv") {
            const csv = serializeSpreadsheetSafeCsv([
                ["index", "uuid"],
                ...formattedUuids.map((id, index) => [index + 1, id] as const),
            ])
            downloadTextFile(csv, "byteflow-uuids.csv", "text/csv;charset=utf-8")
        } else {
            downloadTextFile(formattedUuids.join("\n"), "byteflow-uuids.txt")
        }
        toast.success(t.common.downloaded_file.replace("{filename}", `byteflow-uuids.${format}`))
    }

    const actions: ToolAction[] = [
        {
            id: "generate",
            label: toolT.regenerate_action,
            icon: RefreshCw,
            onClick: generateUuids,
            variant: "default",
        },
        {
            id: "copy_all",
            label: t.common.copy_all,
            icon: Copy,
            onClick: handleCopyAll,
            disabled: formattedUuids.length === 0,
            disabledReason: t.common.action_disabled_no_output,
        },
        {
            id: "download_txt",
            label: toolT.export_txt,
            icon: Download,
            onClick: () => handleDownload("txt"),
            disabled: formattedUuids.length === 0,
            disabledReason: t.common.action_disabled_no_output,
        },
        {
            id: "download_csv",
            label: toolT.export_csv,
            icon: Download,
            onClick: () => handleDownload("csv"),
            disabled: formattedUuids.length === 0,
            disabledReason: t.common.action_disabled_no_output,
        },
        {
            id: "download_json",
            label: toolT.export_json,
            icon: Download,
            onClick: () => handleDownload("json"),
            disabled: formattedUuids.length === 0,
            disabledReason: t.common.action_disabled_no_output,
        },
    ]

    return (
        <div className="flex flex-col h-full space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Hash className="h-6 w-6 text-primary" />
                        {toolT.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Settings Sidebar */}
                <div className="md:col-span-4 lg:col-span-3 space-y-6 flex flex-col">
                    <div className="space-y-4 p-5 border rounded-lg bg-card shadow-sm">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.settings_heading}</h3>

                        <div className="space-y-2">
                            <label htmlFor="uuid-quantity" className="text-sm font-medium">{toolT.quantity_label}</label>
                            <Input
                                id="uuid-quantity"
                                type="number"
                                min={1}
                                max={1000}
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" id="uuid-version-label">{toolT.version_label}</label>
                            <Select value={version} onValueChange={setVersion}>
                                <SelectTrigger aria-labelledby="uuid-version-label">
                                    <SelectValue placeholder={toolT.version_placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="v4">{toolT.version_v4}</SelectItem>
                                    <SelectItem value="v1">{toolT.version_v1}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" id="uuid-case-label">{toolT.case_label}</label>
                            <Select value={caseFormat} onValueChange={setCaseFormat}>
                                <SelectTrigger aria-labelledby="uuid-case-label">
                                    <SelectValue placeholder={toolT.case_placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lowercase">{toolT.case_lowercase}</SelectItem>
                                    <SelectItem value="uppercase">{toolT.case_uppercase}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" id="uuid-hyphens-label">{toolT.hyphens_label}</label>
                            <Select value={hyphens} onValueChange={setHyphens}>
                                <SelectTrigger aria-labelledby="uuid-hyphens-label">
                                    <SelectValue placeholder={toolT.hyphens_placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">{toolT.hyphens_include}</SelectItem>
                                    <SelectItem value="no">{toolT.hyphens_remove}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="uuid-prefix" className="text-sm font-medium">{toolT.prefix_label}</label>
                            <Input
                                id="uuid-prefix"
                                value={prefix}
                                onChange={(e) => setPrefix(e.target.value)}
                                placeholder={toolT.prefix_placeholder}
                                spellCheck={false}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="uuid-suffix" className="text-sm font-medium">{toolT.suffix_label}</label>
                            <Input
                                id="uuid-suffix"
                                value={suffix}
                                onChange={(e) => setSuffix(e.target.value)}
                                placeholder={toolT.suffix_placeholder}
                                spellCheck={false}
                            />
                        </div>

                        <div className="rounded-md border border-border/70 bg-background/60 p-3">
                            <p className="text-xs font-medium text-muted-foreground">{toolT.format_preview_label}</p>
                            <p className="mt-1 break-all font-mono text-xs text-foreground">{previewValue}</p>
                        </div>

                    </div>
                </div>

                {/* Output Section */}
                <div className="md:col-span-8 lg:col-span-9 flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.generated_heading} ({formattedUuids.length})</span>
                        <div className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                            <span>
                                {toolT.page_status
                                    .replace("{page}", String(safePageIndex + 1))
                                    .replace("{pages}", String(totalPages))}
                            </span>
                            <Select value={String(pageSize)} onValueChange={(value) => {
                                setPageSize(Number(value))
                                setPageIndex(0)
                            }}>
                                <SelectTrigger className="h-8 w-[92px]" aria-label={toolT.page_size_label}>
                                    <SelectValue aria-label={toolT.page_size_label} />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZE_OPTIONS.map((value) => (
                                        <SelectItem key={value} value={String(value)}>{value}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-0">
                        <ol className="min-h-[400px] divide-y divide-border/65">
                            {visibleUuids.map((id, index) => (
                                <li key={`${id}-${safePageIndex}-${index}`} className="grid grid-cols-[4.5rem_1fr] gap-3 px-4 py-2.5 font-mono text-sm leading-6">
                                    <span className="text-xs text-muted-foreground">{safePageIndex * pageSize + index + 1}</span>
                                    <span className="break-all text-foreground">{id}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">{toolT.pagination_hint}</p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                                disabled={safePageIndex === 0}
                            >
                                {toolT.previous_page}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPageIndex((current) => Math.min(totalPages - 1, current + 1))}
                                disabled={safePageIndex >= totalPages - 1}
                            >
                                {toolT.next_page}
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
