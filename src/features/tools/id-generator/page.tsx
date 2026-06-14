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
import { v4 as uuidv4 } from "uuid"

function byteToHex(byte: number): string {
    return byte.toString(16).padStart(2, "0")
}

// Clean UUID v7 implementation
function generateUUIDv7(): string {
    const timestamp = Date.now()
    const timestampHex = timestamp.toString(16).padStart(12, "0")

    const randomBytes = crypto.getRandomValues(new Uint8Array(10))
    // Set version to 7 (0111)
    randomBytes[0] = (randomBytes[0] & 0x0f) | 0x70
    // Set variant to 10xx
    randomBytes[2] = (randomBytes[2] & 0x3f) | 0x80

    const randHex = Array.from(randomBytes).map((b) => byteToHex(b)).join("")

    return (
        timestampHex.slice(0, 8) + "-" +
        timestampHex.slice(8, 12) + "-" +
        randHex.slice(0, 4) + "-" +
        randHex.slice(4, 8) + "-" +
        randHex.slice(8, 20)
    )
}

// ─── ULID ───────────────────────────────────────────────────────────────────
const ULID_ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

function generateULID(): string {
    const now = Date.now()
    // 10-char timestamp (48 bits, base32)
    let timePart = ""
    let t = now
    for (let i = 0; i < 10; i++) {
        timePart = ULID_ENCODING[t % 32] + timePart
        t = Math.floor(t / 32)
    }
    // 16-char randomness (80 bits, base32)
    const randBytes = crypto.getRandomValues(new Uint8Array(10))
    let randPart = ""
    // Process 80 bits in groups of 5
    let bits = 0
    let numBits = 0
    let byteIdx = 0
    for (let i = 0; i < 16; i++) {
        while (numBits < 5 && byteIdx < 10) {
            bits = (bits << 8) | randBytes[byteIdx++]
            numBits += 8
        }
        const idx = (bits >> (numBits - 5)) & 0x1f
        randPart += ULID_ENCODING[idx]
        numBits -= 5
    }
    return timePart + randPart
}

function extractULIDTimestamp(ulid: string): Date | null {
    if (ulid.length !== 26) return null
    let timestamp = 0
    for (let i = 0; i < 10; i++) {
        const idx = ULID_ENCODING.indexOf(ulid[i].toUpperCase())
        if (idx === -1) return null
        timestamp = timestamp * 32 + idx
    }
    return new Date(timestamp)
}

// ─── NanoID ─────────────────────────────────────────────────────────────────
const NANOID_DEFAULT_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-"

function generateNanoID(size: number = 21, alphabet: string = NANOID_DEFAULT_ALPHABET): string {
    const mask = (2 << (31 - Math.clz32((alphabet.length - 1) | 1))) - 1
    const step = Math.ceil((1.6 * mask * size) / alphabet.length)
    let id = ""
    while (id.length < size) {
        const bytes = crypto.getRandomValues(new Uint8Array(step))
        for (let i = 0; i < step && id.length < size; i++) {
            const charIdx = bytes[i] & mask
            if (charIdx < alphabet.length) {
                id += alphabet[charIdx]
            }
        }
    }
    return id
}

// ─── UUID v7 timestamp extraction ──────────────────────────────────────────
function extractUUIDv7Timestamp(uuid: string): Date | null {
    const clean = uuid.replace(/-/g, "")
    if (clean.length !== 32) return null
    // Version check: nibble at position 12 should be '7'
    if (clean[12] !== "7") return null
    const timestampHex = clean.slice(0, 12)
    const timestamp = parseInt(timestampHex, 16)
    if (isNaN(timestamp)) return null
    return new Date(timestamp)
}

type IDType = "uuid-v4" | "uuid-v7" | "ulid" | "nanoid"

export function IdGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["id_generator"] as Record<string, string>
    const [ids, setIds] = React.useState<string[]>([])
    const [quantity, setQuantity] = React.useState(5)
    const [idType, setIdType] = React.useState<IDType>("uuid-v4")
    const [nanoidSize, setNanoidSize] = React.useState(21)
    const [nanoidAlphabet, setNanoidAlphabet] = React.useState(NANOID_DEFAULT_ALPHABET)
    const [caseFormat, setCaseFormat] = React.useState<"lowercase" | "uppercase">("lowercase")

    const generate = React.useCallback(() => {
        const qty = Math.min(Math.max(1, quantity), 1000)
        const results: string[] = []
        for (let i = 0; i < qty; i++) {
            let id = ""
            switch (idType) {
                case "uuid-v4":
                    id = uuidv4()
                    break
                case "uuid-v7":
                    id = generateUUIDv7()
                    break
                case "ulid":
                    id = generateULID()
                    break
                case "nanoid":
                    id = generateNanoID(nanoidSize, nanoidAlphabet)
                    break
            }
            if (caseFormat === "uppercase" && idType !== "nanoid") {
                id = id.toUpperCase()
            }
            results.push(id)
        }
        setIds(results)
    }, [quantity, idType, caseFormat, nanoidSize, nanoidAlphabet])

    React.useEffect(() => {
        generate()
    }, [generate])

    const handleCopyAll = async () => {
        if (ids.length === 0) return
        const result = await safeClipboardWrite(ids.join("\n"))
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: toolT.copied_desc.replace("{count}", String(ids.length)),
        })
    }

    // Show timestamp for UUID v7 or ULID (first ID only)
    const timestampInfo = React.useMemo(() => {
        if (ids.length === 0) return null
        const firstId = ids[0]
        if (idType === "uuid-v7") {
            const date = extractUUIDv7Timestamp(firstId)
            return date ? toolT.embedded_timestamp.replace("{value}", date.toISOString()) : null
        }
        if (idType === "ulid") {
            const date = extractULIDTimestamp(firstId)
            return date ? toolT.embedded_timestamp.replace("{value}", date.toISOString()) : null
        }
        return null
    }, [ids, idType, toolT.embedded_timestamp])

    return (
        <div className="flex flex-col h-full space-y-6 max-w-5xl mx-auto">
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
                    <Button size="sm" onClick={generate}>
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
                            <label className="text-sm font-medium">{toolT.id_type_label}</label>
                            <Select value={idType} onValueChange={(v) => setIdType(v as IDType)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="uuid-v4">{toolT.option_uuid_v4}</SelectItem>
                                    <SelectItem value="uuid-v7">{toolT.option_uuid_v7}</SelectItem>
                                    <SelectItem value="ulid">{toolT.option_ulid}</SelectItem>
                                    <SelectItem value="nanoid">{toolT.option_nanoid}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

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

                        {idType !== "nanoid" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{toolT.case_label}</label>
                                <Select value={caseFormat} onValueChange={(v) => setCaseFormat(v as "lowercase" | "uppercase")}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                                    <label className="text-sm font-medium">{toolT.length_label}</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={256}
                                        value={nanoidSize}
                                        onChange={(e) => setNanoidSize(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{toolT.alphabet_label}</label>
                                    <Input
                                        className="font-mono text-xs"
                                        value={nanoidAlphabet}
                                        onChange={(e) => setNanoidAlphabet(e.target.value)}
                                    />
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
                            <span>{toolT.generated_heading} ({ids.length})</span>
                            {timestampInfo && (
                                <span className="text-xs text-muted-foreground font-normal">{timestampInfo}</span>
                            )}
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => void handleCopyAll()}>
                            <Copy className="h-4 w-4" />
                            {t.common.copy_all}
                        </Button>
                    </div>
                    <div className="flex-1 p-0">
                        <Textarea
                            className="h-full min-h-[400px] w-full resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 p-6 font-mono text-sm leading-8 text-foreground"
                            value={ids.join("\n")}
                            readOnly
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>

            <RelatedTools toolKey="id_generator" />
        </div>
    )
}
