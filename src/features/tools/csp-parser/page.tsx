"use client"

import * as React from "react"
import { Shield, Eraser, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"

const CSP_DIRECTIVE_KEYS: Record<string, { descriptionKey: string; risk: "low" | "medium" | "high" | "info" }> = {
    "default-src": { descriptionKey: "directive_default_src_desc", risk: "info" },
    "script-src": { descriptionKey: "directive_script_src_desc", risk: "high" },
    "style-src": { descriptionKey: "directive_style_src_desc", risk: "medium" },
    "img-src": { descriptionKey: "directive_img_src_desc", risk: "low" },
    "font-src": { descriptionKey: "directive_font_src_desc", risk: "low" },
    "connect-src": { descriptionKey: "directive_connect_src_desc", risk: "medium" },
    "media-src": { descriptionKey: "directive_media_src_desc", risk: "low" },
    "object-src": { descriptionKey: "directive_object_src_desc", risk: "high" },
    "frame-src": { descriptionKey: "directive_frame_src_desc", risk: "medium" },
    "child-src": { descriptionKey: "directive_child_src_desc", risk: "medium" },
    "worker-src": { descriptionKey: "directive_worker_src_desc", risk: "medium" },
    "frame-ancestors": { descriptionKey: "directive_frame_ancestors_desc", risk: "high" },
    "form-action": { descriptionKey: "directive_form_action_desc", risk: "medium" },
    "base-uri": { descriptionKey: "directive_base_uri_desc", risk: "medium" },
    "upgrade-insecure-requests": { descriptionKey: "directive_upgrade_insecure_requests_desc", risk: "info" },
    "block-all-mixed-content": { descriptionKey: "directive_block_all_mixed_content_desc", risk: "info" },
    "report-uri": { descriptionKey: "directive_report_uri_desc", risk: "info" },
    "report-to": { descriptionKey: "directive_report_to_desc", risk: "info" },
    "require-trusted-types-for": { descriptionKey: "directive_require_trusted_types_for_desc", risk: "info" },
    "trusted-types": { descriptionKey: "directive_trusted_types_desc", risk: "info" },
    "sandbox": { descriptionKey: "directive_sandbox_desc", risk: "info" },
}

const UNSAFE_KEYWORDS = ["'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "data:", "blob:"]

interface ParsedDirective {
    name: string
    values: string[]
    description: string
    risk: "low" | "medium" | "high" | "info"
    warnings: string[]
}

function getMissingDirectives(parsed: ParsedDirective[]): string[] {
    const present = new Set(parsed.map((d) => d.name))
    const recommended = ["default-src", "script-src", "object-src", "base-uri", "frame-ancestors"]
    return recommended.filter((d) => !present.has(d))
}

export function CspParserPage() {
    const { t } = useLang()
    const toolT = t.tools["csp_parser"] as Record<string, string>
    const [csp, setCsp] = React.useState("default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src * data:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.example.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'")
    const [parsed, setParsed] = React.useState<ParsedDirective[]>([])
    const [missing, setMissing] = React.useState<string[]>([])

    const parseCSP = React.useCallback((value: string) => {
        const directives = value.split(";").map((item) => item.trim()).filter(Boolean)
        return directives.map((directive) => {
            const parts = directive.split(/\s+/)
            const name = parts[0].toLowerCase()
            const values = parts.slice(1)
            const info = CSP_DIRECTIVE_KEYS[name]
            const warnings: string[] = []

            for (const token of values) {
                if (UNSAFE_KEYWORDS.includes(token.toLowerCase())) {
                    warnings.push(toolT.warning_unsafe_keyword.replace("{value}", token))
                }
                if (token === "*") {
                    warnings.push(toolT.warning_wildcard)
                }
            }

            if (name === "script-src" && !values.some((token) => token.includes("nonce-") || token.includes("hash-") || token === "'strict-dynamic'")) {
                if (values.includes("'unsafe-inline'")) {
                    warnings.push(toolT.warning_use_nonce_hash)
                }
            }

            return {
                name,
                values,
                description: info ? toolT[info.descriptionKey] : toolT.unknown_directive,
                risk: info?.risk || "info",
                warnings,
            }
        })
    }, [toolT])

    const analyze = () => {
        if (!csp.trim()) { setParsed([]); setMissing([]); return }
        const p = parseCSP(csp)
        setParsed(p)
        setMissing(getMissingDirectives(p))
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => { analyze() }, [csp])

    const totalWarnings = parsed.reduce((acc, d) => acc + d.warnings.length, 0)

    const riskColors = {
        high: "text-red-500 bg-red-500/10",
        medium: "text-amber-500 bg-amber-500/10",
        low: "text-emerald-500 bg-emerald-500/10",
        info: "text-blue-500 bg-blue-500/10",
    }
    const riskLabels: Record<ParsedDirective["risk"], string> = {
        high: toolT.risk_high,
        medium: toolT.risk_medium,
        low: toolT.risk_low,
        info: toolT.risk_info,
    }

    return (
        <div className="flex flex-col h-full space-y-6 max-w-5xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCsp("")}>
                    <Eraser className="mr-2 h-4 w-4" />{t.common.clear}
                </Button>
            </div>

            <SensitiveInputWarning />

            <div className="space-y-2">
                <label className="text-sm font-medium">{toolT.input_label}</label>
                <Textarea className="min-h-[100px] font-mono text-xs leading-5" value={csp} onChange={(e) => setCsp(e.target.value)} spellCheck={false}
                    placeholder={toolT.placeholder} />
            </div>

            {/* Summary */}
            {parsed.length > 0 && (
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-500" />{parsed.length} {toolT.directives}</span>
                    {totalWarnings > 0 && <span className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-amber-500" />{totalWarnings} {toolT.warnings}</span>}
                    {missing.length > 0 && <span className="flex items-center gap-1"><XCircle className="h-4 w-4 text-red-500" />{missing.length} {toolT.missing}</span>}
                </div>
            )}

            {/* Directives */}
            {parsed.length > 0 && (
                <div className="space-y-3">
                    {parsed.map((d, i) => (
                        <div key={i} className="p-4 border rounded-lg bg-card shadow-sm space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${riskColors[d.risk]}`}>{riskLabels[d.risk]}</span>
                                <span className="font-semibold font-mono text-sm">{d.name}</span>
                                <span className="text-xs text-muted-foreground">— {d.description}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {d.values.map((v, j) => (
                                    <span key={j} className={`text-xs font-mono px-2 py-0.5 rounded ${UNSAFE_KEYWORDS.includes(v.toLowerCase()) || v === "*" ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"}`}>{v}</span>
                                ))}
                            </div>
                            {d.warnings.length > 0 && (
                                <div className="space-y-1">
                                    {d.warnings.map((w, j) => (
                                        <p key={j} className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3 shrink-0" />{w}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Missing Directives */}
            {missing.length > 0 && (
                <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/5 space-y-2">
                    <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">{toolT.missing_title}</h3>
                    <div className="flex flex-wrap gap-2">
                        {missing.map((m) => (
                            <span key={m} className="text-xs font-mono bg-red-500/10 text-red-500 px-2 py-1 rounded">{m}</span>
                        ))}
                    </div>
                </div>
            )}

            <RelatedTools toolKey="csp_parser" />
        </div>
    )
}
