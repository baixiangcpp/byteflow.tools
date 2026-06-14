"use client"

import * as React from "react"
import { Copy, FileText, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { decodeSaml, type SamlDecodeResult } from "@/features/tools/saml-decoder/utils"

export function SamlDecoderPage() {
    const { t } = useLang()
    const toolT = t.tools["saml_decoder"] as Record<string, string> | undefined
    const text = React.useCallback((key: string) => toolT?.[key] || key, [toolT])

    const [input, setInput] = React.useState("")
    const [result, setResult] = React.useState<SamlDecodeResult | null>(null)

    const run = React.useCallback(() => {
        if (!input.trim()) {
            toast.error(t.common.input_required)
            return
        }
        const next = decodeSaml(input)
        setResult(next)
        if (next.ok) toast.success(text("decoded"))
        else toast.error(text("decode_failed"))
    }, [input, t.common.input_required, text])

    const copyXml = React.useCallback(async () => {
        if (!result?.xml) return
        const copied = await safeClipboardWrite(result.xml)
        if (!copied.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }, [result, t.common.copy_failed, t.common.copied])

    const loadExample = React.useCallback(() => {
        setInput(btoa(`<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Destination="https://sp.example.com/acs">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">https://idp.example.com</saml:Issuer>
  <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_abc123">
    <saml:Subject><saml:NameID>alice@example.com</saml:NameID><saml:SubjectConfirmation><saml:SubjectConfirmationData Recipient="https://sp.example.com/acs" /></saml:SubjectConfirmation></saml:Subject>
    <saml:Conditions NotBefore="2026-06-10T10:00:00Z" NotOnOrAfter="2026-06-10T11:00:00Z"><saml:AudienceRestriction><saml:Audience>https://sp.example.com</saml:Audience></saml:AudienceRestriction></saml:Conditions>
    <saml:AttributeStatement><saml:Attribute Name="role"><saml:AttributeValue>admin</saml:AttributeValue></saml:Attribute></saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`))
        setResult(null)
    }, [])

    const summaryRows: Array<[string, string | undefined]> = result?.summary ? [
        ["binding", result.summary.bindingHint],
        ["root", result.summary.rootElement],
        ["issuer", result.summary.issuer],
        ["name_id", result.summary.nameId],
        ["destination", result.summary.destination],
        ["audience", result.summary.audience],
        ["recipient", result.summary.recipient],
        ["not_before", result.summary.notBefore],
        ["not_on_or_after", result.summary.notOnOrAfter],
        ["signatures", String(result.summary.signatures)],
        ["certificates", String(result.summary.certificates)],
    ] : []

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">{text("description")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={loadExample}><FileText className="mr-2 h-4 w-4" />{t.common.try_example}</Button>
                    <Button size="sm" onClick={run}><ShieldCheck className="mr-2 h-4 w-4" />{text("decode_action")}</Button>
                    <Button variant="outline" size="sm" onClick={() => void copyXml()} disabled={!result?.xml}><Copy className="mr-2 h-4 w-4" />{text("copy_xml")}</Button>
                </div>
            </div>

            <Alert>
                <AlertDescription>{text("verification_note")}</AlertDescription>
            </Alert>
            {result?.error ? <Alert variant="destructive"><AlertDescription>{result.error}</AlertDescription></Alert> : null}
            {result?.warnings.map((warning) => <Alert key={warning}><AlertDescription>{warning}</AlertDescription></Alert>)}

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="space-y-2">
                    <Label htmlFor="saml-input">{text("input_label")}</Label>
                    <Textarea id="saml-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={text("input_placeholder")} className="min-h-[520px] font-mono text-sm" spellCheck={false} />
                </section>
                <section className="space-y-2">
                    <Label>{text("xml_output")}</Label>
                    <Textarea value={result?.xml || ""} readOnly placeholder={text("xml_placeholder")} className="min-h-[520px] bg-muted font-mono text-sm" spellCheck={false} />
                </section>
            </div>

            {result?.summary ? (
                <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-lg border">
                        <div className="border-b bg-muted px-4 py-2 text-sm font-semibold">{text("summary")}</div>
                        <table className="w-full text-sm">
                            <tbody>
                                {summaryRows.map(([key, value]) => (
                                    <tr key={key} className="border-b last:border-b-0">
                                        <td className="px-4 py-2 text-muted-foreground">{text(key)}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{value || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                        <div className="border-b bg-muted px-4 py-2 text-sm font-semibold">{text("attributes")}</div>
                        <div className="max-h-[360px] overflow-auto">
                            <table className="w-full text-sm">
                                <tbody>
                                    {result.summary.attributes.map((attribute) => (
                                        <tr key={attribute.name} className="border-b last:border-b-0">
                                            <td className="px-4 py-2 font-mono text-xs">{attribute.name}</td>
                                            <td className="px-4 py-2 font-mono text-xs">{attribute.values.join(", ") || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
