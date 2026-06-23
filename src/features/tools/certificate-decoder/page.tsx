"use client"

import * as React from "react"
import { Shield, FileKey, AlertTriangle, CheckCircle, Clipboard, Eraser } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"

// ─── ASN.1 / PEM Parser (Pure JS, no dependencies) ──────────────────────────

function pemToBytes(pem: string): Uint8Array {
    const lines = pem.split("\n").filter((l) => !l.startsWith("-----") && l.trim() !== "")
    const b64 = lines.join("")
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

interface ASN1Node {
    tag: number
    tagClass: number
    constructed: boolean
    length: number
    value: Uint8Array
    children: ASN1Node[]
    offset: number
}

function parseASN1(data: Uint8Array, offset = 0): ASN1Node {
    const startOffset = offset
    const tag = data[offset++]
    const tagClass = (tag >> 6) & 0x03
    const constructed = !!(tag & 0x20)

    let length = data[offset++]
    if (length & 0x80) {
        const numBytes = length & 0x7f
        length = 0
        for (let i = 0; i < numBytes; i++) {
            length = (length << 8) | data[offset++]
        }
    }

    const value = data.slice(offset, offset + length)
    const children: ASN1Node[] = []

    if (constructed) {
        let childOffset = 0
        while (childOffset < value.length) {
            try {
                const child = parseASN1(value, childOffset)
                children.push(child)
                childOffset += child.length + (child.offset - childOffset) + (childOffset === 0 ? 0 : 0)
                break // Simplified: parse all children via recursive approach
            } catch {
                break
            }
        }
        // Better approach: parse children iteratively
        children.length = 0
        let pos = 0
        while (pos < value.length) {
            try {
                const child = parseASN1(value, pos)
                children.push(child)
                pos += getNodeSize(value, pos)
            } catch {
                break
            }
        }
    }

    return { tag: tag & 0x1f, tagClass, constructed, length, value, children, offset: startOffset }
}

function getNodeSize(data: Uint8Array, offset: number): number {
    let pos = offset + 1
    let length = data[pos++]
    if (length & 0x80) {
        const numBytes = length & 0x7f
        length = 0
        for (let i = 0; i < numBytes; i++) {
            length = (length << 8) | data[pos++]
        }
    }
    return (pos - offset) + length
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(":")
}

function decodeOID(bytes: Uint8Array): string {
    const parts: number[] = []
    parts.push(Math.floor(bytes[0] / 40))
    parts.push(bytes[0] % 40)

    let value = 0
    for (let i = 1; i < bytes.length; i++) {
        value = (value << 7) | (bytes[i] & 0x7f)
        if (!(bytes[i] & 0x80)) {
            parts.push(value)
            value = 0
        }
    }
    return parts.join(".")
}

function decodeUTFString(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes)
}

function decodeTime(bytes: Uint8Array, isGeneralized: boolean): string {
    const str = decodeUTFString(bytes)
    if (isGeneralized) {
        // YYYYMMDDHHmmSSZ
        return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)} ${str.slice(8, 10)}:${str.slice(10, 12)}:${str.slice(12, 14)} UTC`
    }
    // YYMMDDHHmmSSZ
    const year = parseInt(str.slice(0, 2))
    const fullYear = year >= 50 ? 1900 + year : 2000 + year
    return `${fullYear}-${str.slice(2, 4)}-${str.slice(4, 6)} ${str.slice(6, 8)}:${str.slice(8, 10)}:${str.slice(10, 12)} UTC`
}

// OID to friendly name mapping
const OID_NAMES: Record<string, string> = {
    "2.5.4.3": "CN", "2.5.4.6": "C", "2.5.4.7": "L", "2.5.4.8": "ST",
    "2.5.4.10": "O", "2.5.4.11": "OU", "2.5.4.5": "serialNumber",
    "1.2.840.113549.1.1.1": "RSA", "1.2.840.113549.1.1.11": "SHA256withRSA",
    "1.2.840.113549.1.1.12": "SHA384withRSA", "1.2.840.113549.1.1.13": "SHA512withRSA",
    "1.2.840.113549.1.1.5": "SHA1withRSA", "1.2.840.10045.2.1": "EC",
    "1.2.840.10045.4.3.2": "ECDSA-SHA256", "1.2.840.10045.4.3.3": "ECDSA-SHA384",
    "1.3.6.1.5.5.7.1.1": "Authority Info Access",
    "2.5.29.14": "Subject Key Identifier", "2.5.29.15": "Key Usage",
    "2.5.29.17": "Subject Alt Name", "2.5.29.19": "Basic Constraints",
    "2.5.29.31": "CRL Distribution Points", "2.5.29.32": "Certificate Policies",
    "2.5.29.35": "Authority Key Identifier", "2.5.29.37": "Extended Key Usage",
    "1.3.6.1.5.5.7.3.1": "serverAuth", "1.3.6.1.5.5.7.3.2": "clientAuth",
}

interface CertInfo {
    subject: string
    issuer: string
    serialNumber: string
    notBefore: string
    notAfter: string
    signatureAlgorithm: string
    publicKeyAlgorithm: string
    publicKeyBits: number
    extensions: { name: string; value: string; critical: boolean }[]
    isValid: boolean
    isSelfSigned: boolean
}

function parseDN(node: ASN1Node): string {
    const parts: string[] = []
    for (const rdnSet of node.children) {
        for (const rdn of rdnSet.children) {
            if (rdn.children.length >= 2) {
                const oid = decodeOID(rdn.children[0].value)
                const name = OID_NAMES[oid] || oid
                const val = decodeUTFString(rdn.children[1].value)
                parts.push(`${name}=${val}`)
            }
        }
    }
    return parts.join(", ")
}

function parseCertificate(pem: string): CertInfo | null {
    try {
        const bytes = pemToBytes(pem)
        const root = parseASN1(bytes)
        const tbsCert = root.children[0] // TBSCertificate

        // Version (optional, context tag 0)
        let idx = 0
        if (tbsCert.children[idx]?.tagClass === 2 && tbsCert.children[idx]?.tag === 0) {
            idx++ // skip version
        }

        // Serial Number
        const serialNumber = bytesToHex(tbsCert.children[idx++].value)

        // Signature Algorithm
        const sigAlgNode = tbsCert.children[idx++]
        const sigAlgOID = decodeOID(sigAlgNode.children[0].value)
        const signatureAlgorithm = OID_NAMES[sigAlgOID] || sigAlgOID

        // Issuer
        const issuer = parseDN(tbsCert.children[idx++])

        // Validity
        const validity = tbsCert.children[idx++]
        const notBefore = decodeTime(validity.children[0].value, validity.children[0].tag === 24)
        const notAfter = decodeTime(validity.children[1].value, validity.children[1].tag === 24)

        // Subject
        const subject = parseDN(tbsCert.children[idx++])

        // Subject Public Key Info
        const spki = tbsCert.children[idx++]
        const pkAlgOID = decodeOID(spki.children[0].children[0].value)
        const publicKeyAlgorithm = OID_NAMES[pkAlgOID] || pkAlgOID
        const publicKeyBits = (spki.children[1].value.length - 1) * 8

        // Extensions (optional, context tag 3)
        const extensions: { name: string; value: string; critical: boolean }[] = []
        for (; idx < tbsCert.children.length; idx++) {
            if (tbsCert.children[idx].tagClass === 2 && tbsCert.children[idx].tag === 3) {
                const extSeq = tbsCert.children[idx].children[0]
                for (const ext of extSeq.children) {
                    const extOID = decodeOID(ext.children[0].value)
                    const extName = OID_NAMES[extOID] || extOID
                    let critical = false
                    let valueIdx = 1
                    if (ext.children.length > 2 && ext.children[1].tag === 1) {
                        critical = ext.children[1].value[0] !== 0
                        valueIdx = 2
                    }
                    const extValue = bytesToHex(ext.children[valueIdx]?.value || new Uint8Array())
                    extensions.push({ name: extName, value: extValue.slice(0, 64) + (extValue.length > 64 ? "..." : ""), critical })
                }
            }
        }

        // Check validity
        const now = new Date()
        const nbDate = new Date(notBefore.replace(" UTC", "Z").replace(" ", "T"))
        const naDate = new Date(notAfter.replace(" UTC", "Z").replace(" ", "T"))
        const isValid = now >= nbDate && now <= naDate

        return {
            subject, issuer, serialNumber, notBefore, notAfter,
            signatureAlgorithm, publicKeyAlgorithm, publicKeyBits,
            extensions, isValid, isSelfSigned: subject === issuer,
        }
    } catch {
        return null
    }
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-border/30 last:border-0">
            <span className="text-sm font-medium text-muted-foreground sm:w-40 shrink-0">{label}</span>
            <span className={`text-sm break-all ${mono ? "font-mono" : ""}`}>{value}</span>
        </div>
    )
}

export function CertificateDecoderPage() {
    const { t } = useLang()
    const toolT = t.tools["certificate_decoder"] as Record<string, string>
    const text = (key: string) => toolT[key]
    const [pem, setPem] = React.useState("")
    const [certInfo, setCertInfo] = React.useState<CertInfo | null>(null)
    const [error, setError] = React.useState<string | null>(null)

    const decode = () => {
        if (!pem.trim()) {
            setCertInfo(null)
            setError(null)
            return
        }

        const result = parseCertificate(pem)
        if (!result) {
            setError(text("parse_error"))
            setCertInfo(null)
        } else {
            setCertInfo(result)
            setError(null)
        }
    }

    const handleClear = () => {
        setPem("")
        setCertInfo(null)
        setError(null)
    }

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText()
            setPem(text)
        } catch { /* ignore */ }
    }

    const actions: ToolAction[] = [
        {
            id: "paste",
            label: t.common.paste,
            icon: Clipboard,
            onClick: () => {
                void handlePaste()
            },
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
        },
        {
            id: "decode",
            label: text("decode_action"),
            icon: Shield,
            onClick: decode,
            variant: "default",
        },
    ]

    return (
        <div className="flex flex-col h-full space-y-6 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <FileKey className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {text("description")}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            {/* Input */}
            <SensitiveInputWarning variant="certificate" />

            <div className="space-y-2">
                <label className="text-sm font-medium">{text("pem_certificate_label")}</label>
                <Textarea
                    className="min-h-[200px] font-mono text-xs leading-5"
                    placeholder={"-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----"}
                    value={pem}
                    onChange={(e) => setPem(e.target.value)}
                    spellCheck={false}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 text-sm font-medium text-destructive-foreground bg-destructive/90 rounded-md flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />{error}
                </div>
            )}

            {/* Decoded Info */}
            {certInfo && (
                <div className="space-y-6">
                    {/* Validity Banner */}
                    <div className={`p-4 rounded-lg flex items-center gap-3 ${certInfo.isValid ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                        {certInfo.isValid ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        <span className="font-medium">
                            {certInfo.isValid
                                ? text("validity_valid")
                                : text("validity_invalid")}
                        </span>
                        {certInfo.isSelfSigned && (
                            <span className="ml-auto text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded">
                                {text("self_signed")}
                            </span>
                        )}
                    </div>

                    {/* Certificate Details */}
                    <div className="p-5 border rounded-lg bg-card shadow-sm space-y-1">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">{text("certificate_details")}</h3>
                        <InfoRow label={text("subject_label")} value={certInfo.subject} mono />
                        <InfoRow label={text("issuer_label")} value={certInfo.issuer} mono />
                        <InfoRow label={text("serial_number_label")} value={certInfo.serialNumber} mono />
                        <InfoRow label={text("not_before_label")} value={certInfo.notBefore} />
                        <InfoRow label={text("not_after_label")} value={certInfo.notAfter} />
                        <InfoRow label={text("signature_algorithm_label")} value={certInfo.signatureAlgorithm} />
                        <InfoRow label={text("public_key_label")} value={`${certInfo.publicKeyAlgorithm} (${certInfo.publicKeyBits} bits)`} />
                    </div>

                    {/* Extensions */}
                    {certInfo.extensions.length > 0 && (
                        <div className="p-5 border rounded-lg bg-card shadow-sm">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">{text("extensions_label")}</h3>
                            <div className="space-y-2">
                                {certInfo.extensions.map((ext, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-border/30 last:border-0">
                                        <div className="flex items-center gap-2 sm:w-56 shrink-0">
                                            <span className="text-sm font-medium text-muted-foreground">{ext.name}</span>
                                            {ext.critical && (
                                                <span className="text-[10px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded">{text("critical_label")}</span>
                                            )}
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground break-all">{ext.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <RelatedTools toolKey="certificate_decoder" />
        </div>
    )
}
