"use client"

import * as React from "react"
import { Copy, RefreshCw, Hash } from "lucide-react"
import { toast } from "sonner"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { v1 as uuidv1, v4 as uuidv4 } from "uuid"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function UuidGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["uuid_generator"] as Record<string, string>
    const [uuids, setUuids] = React.useState<string[]>([])
    const [quantity, setQuantity] = React.useState(5)
    const [version, setVersion] = React.useState("v4")
    const [caseFormat, setCaseFormat] = React.useState("lowercase")
    const [hyphens, setHyphens] = React.useState("yes")

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
    }, [quantity, version, caseFormat, hyphens])

    // Initial generation
    React.useEffect(() => {
        generateUuids()
    }, [generateUuids])

    const handleCopyAll = async () => {
        if (uuids.length === 0) return
        const result = await safeClipboardWrite(uuids.join("\n"))
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: toolT.copied_desc.replace("{count}", String(uuids.length)),
        })
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
            onClick: () => void handleCopyAll(),
            disabled: uuids.length === 0,
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
                            <label className="text-sm font-medium">{toolT.quantity_label}</label>
                            <Input
                                type="number"
                                min={1}
                                max={1000}
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{toolT.version_label}</label>
                            <Select value={version} onValueChange={setVersion}>
                                <SelectTrigger>
                                    <SelectValue placeholder={toolT.version_placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="v4">{toolT.version_v4}</SelectItem>
                                    <SelectItem value="v1">{toolT.version_v1}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{toolT.case_label}</label>
                            <Select value={caseFormat} onValueChange={setCaseFormat}>
                                <SelectTrigger>
                                    <SelectValue placeholder={toolT.case_placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lowercase">{toolT.case_lowercase}</SelectItem>
                                    <SelectItem value="uppercase">{toolT.case_uppercase}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{toolT.hyphens_label}</label>
                            <Select value={hyphens} onValueChange={setHyphens}>
                                <SelectTrigger>
                                    <SelectValue placeholder={toolT.hyphens_placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">{toolT.hyphens_include}</SelectItem>
                                    <SelectItem value="no">{toolT.hyphens_remove}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                    </div>
                </div>

                {/* Output Section */}
                <div className="md:col-span-8 lg:col-span-9 flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.generated_heading} ({uuids.length})</span>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[400px] w-full resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 p-6 font-mono text-sm leading-8 text-foreground"
                            value={uuids.join("\n")}
                            readOnly
                            spellCheck={false}
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}
