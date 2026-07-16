"use client"

import * as React from "react"
import { Copy, RefreshCw, Fingerprint } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
    NANOID_DEFAULT_ALPHABET,
    extractULIDTimestamp,
    extractUUIDv7Timestamp,
    generateIdBatch,
    validateIdGeneratorSettings,
    type IDCaseFormat,
    type IDType,
} from "./logic"
import { ToolPageContainer } from "@/components/layout/page-container"

export function IdGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["id_generator"] as Record<string, string>
    const [ids, setIds] = React.useState<string[]>([])
    const [quantity, setQuantity] = React.useState("5")
    const [idType, setIdType] = React.useState<IDType>("uuid-v4")
    const [nanoidSize, setNanoidSize] = React.useState("21")
    const [nanoidAlphabet, setNanoidAlphabet] = React.useState(NANOID_DEFAULT_ALPHABET)
    const [caseFormat, setCaseFormat] = React.useState<IDCaseFormat>("lowercase")
    const [generationFailed, setGenerationFailed] = React.useState(false)

    const validation = React.useMemo(() => validateIdGeneratorSettings({
        quantity,
        idType,
        caseFormat,
        nanoidSize,
        nanoidAlphabet,
    }), [quantity, idType, caseFormat, nanoidSize, nanoidAlphabet])

    const generate = React.useCallback(() => {
        if (!validation.ok) {
            setIds([])
            setGenerationFailed(false)
            return
        }

        try {
            setIds(generateIdBatch(validation.value))
            setGenerationFailed(false)
        } catch {
            setIds([])
            setGenerationFailed(true)
        }
    }, [validation])

    React.useEffect(() => {
        generate()
    }, [generate])

    const outputIds = React.useMemo(
        () => validation.ok && !generationFailed ? ids : [],
        [generationFailed, ids, validation.ok],
    )

    const handleCopyAll = async () => {
        if (outputIds.length === 0) return
        const result = await safeClipboardWrite(outputIds.join("\n"))
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: toolT.copied_desc.replace("{count}", String(outputIds.length)),
        })
    }

    // Show timestamp for UUID v7 or ULID (first ID only)
    const timestampInfo = React.useMemo(() => {
        if (outputIds.length === 0) return null
        const firstId = outputIds[0]
        if (idType === "uuid-v7") {
            const date = extractUUIDv7Timestamp(firstId)
            return date ? toolT.embedded_timestamp.replace("{value}", date.toISOString()) : null
        }
        if (idType === "ulid") {
            const date = extractULIDTimestamp(firstId)
            return date ? toolT.embedded_timestamp.replace("{value}", date.toISOString()) : null
        }
        return null
    }, [outputIds, idType, toolT.embedded_timestamp])

    const quantityError = validation.errors.quantity ? toolT[validation.errors.quantity] : null
    const nanoidSizeError = validation.errors.nanoidSize ? toolT[validation.errors.nanoidSize] : null
    const nanoidAlphabetError = validation.errors.nanoidAlphabet ? toolT[validation.errors.nanoidAlphabet] : null

    return (
        <ToolPageContainer className="flex flex-col h-full space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Fingerprint className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={generate} disabled={!validation.ok}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {toolT.regenerate_action}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Settings Sidebar */}
                <div className="md:col-span-4 lg:col-span-3 space-y-6 flex flex-col">
                    <div className="space-y-4 p-5 border rounded-lg bg-card shadow-sm">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.settings_heading}</h3>

                        <div className="space-y-2">
                            <label htmlFor="id-generator-type" className="text-sm font-medium">{toolT.id_type_label}</label>
                            <Select value={idType} onValueChange={(v) => setIdType(v as IDType)}>
                                <SelectTrigger id="id-generator-type" aria-label={toolT.id_type_label}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="uuid-v4">{toolT.option_uuid_v4}</SelectItem>
                                    <SelectItem value="uuid-v7">{toolT.option_uuid_v7}</SelectItem>
                                    <SelectItem value="ulid">{toolT.option_ulid}</SelectItem>
                                    <SelectItem value="nanoid">{toolT.option_nanoid}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="id-generator-quantity" className="text-sm font-medium">{toolT.quantity_label}</label>
                            <Input
                                id="id-generator-quantity"
                                type="number"
                                min={1}
                                max={1000}
                                step={1}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                aria-invalid={quantityError ? "true" : undefined}
                                aria-describedby={quantityError ? "id-generator-quantity-error" : undefined}
                            />
                            {quantityError && (
                                <p id="id-generator-quantity-error" role="alert" className="text-sm text-destructive">
                                    {quantityError}
                                </p>
                            )}
                        </div>

                        {idType !== "nanoid" && (
                            <div className="space-y-2">
                                <label htmlFor="id-generator-case" className="text-sm font-medium">{toolT.case_label}</label>
                                <Select value={caseFormat} onValueChange={(v) => setCaseFormat(v as IDCaseFormat)}>
                                    <SelectTrigger id="id-generator-case" aria-label={toolT.case_label}><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lowercase">{toolT.case_lowercase}</SelectItem>
                                        <SelectItem value="uppercase">{toolT.case_uppercase}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {idType === "nanoid" && (
                            <>
                                <div className="space-y-2">
                                    <label htmlFor="id-generator-nanoid-size" className="text-sm font-medium">{toolT.length_label}</label>
                                    <Input
                                        id="id-generator-nanoid-size"
                                        type="number"
                                        min={1}
                                        max={256}
                                        step={1}
                                        value={nanoidSize}
                                        onChange={(e) => setNanoidSize(e.target.value)}
                                        aria-invalid={nanoidSizeError ? "true" : undefined}
                                        aria-describedby={nanoidSizeError ? "id-generator-nanoid-size-error" : undefined}
                                    />
                                    {nanoidSizeError && (
                                        <p id="id-generator-nanoid-size-error" role="alert" className="text-sm text-destructive">
                                            {nanoidSizeError}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="id-generator-nanoid-alphabet" className="text-sm font-medium">{toolT.alphabet_label}</label>
                                    <Input
                                        id="id-generator-nanoid-alphabet"
                                        className="font-mono text-xs"
                                        value={nanoidAlphabet}
                                        onChange={(e) => setNanoidAlphabet(e.target.value)}
                                        aria-invalid={nanoidAlphabetError ? "true" : undefined}
                                        aria-describedby={nanoidAlphabetError ? "id-generator-nanoid-alphabet-error" : undefined}
                                    />
                                    {nanoidAlphabetError && (
                                        <p id="id-generator-nanoid-alphabet-error" role="alert" className="text-sm text-destructive">
                                            {nanoidAlphabetError}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Info cards */}
                    <div className="p-4 border rounded-lg bg-card shadow-sm space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{toolT.about_heading.replace("{type}", idType.toUpperCase())}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {idType === "uuid-v4" && toolT.about_uuid_v4}
                            {idType === "uuid-v7" && toolT.about_uuid_v7}
                            {idType === "ulid" && toolT.about_ulid}
                            {idType === "nanoid" && toolT.about_nanoid}
                        </p>
                    </div>
                </div>

                {/* Output Section */}
                <div className="md:col-span-8 lg:col-span-9 flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div className="tool-pane-header tool-pane-header-between">
                        <div className="flex items-center gap-3">
                            <span>{toolT.generated_heading} ({outputIds.length})</span>
                            {timestampInfo && (
                                <span className="text-xs text-muted-foreground font-normal">{timestampInfo}</span>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2"
                            onClick={() => void handleCopyAll()}
                            disabled={!validation.ok || generationFailed || outputIds.length === 0}
                        >
                            <Copy className="h-4 w-4" />
                            {t.common.copy_all}
                        </Button>
                    </div>
                    {generationFailed && (
                        <div role="alert" className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {toolT.error_generation_failed}
                        </div>
                    )}
                    <div className="flex-1 p-0">
                        <Textarea
                            aria-label={toolT.generated_heading}
                            className="h-full min-h-[400px] w-full resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 p-6 font-mono text-sm leading-8 text-foreground"
                            value={outputIds.join("\n")}
                            readOnly
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>

            <RelatedTools toolKey="id_generator" />
        </ToolPageContainer>
    )
}
