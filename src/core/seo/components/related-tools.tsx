"use client"

import Link from "next/link"
import { useLang } from "@/core/i18n/lang-provider"
import { getDiscoveryRelatedTools, getDiscoveryToolByKey } from "@/generated/discovery-tool-index"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { trackRelatedToolClick } from "@/core/analytics/analytics"
import { ArrowRight } from "lucide-react"

const RELATED_TOOL_REASON_COPY: Record<string, string> = {
    adapt_preview_for_instagram: "Adapt the same preview assets for Instagram post copy.",
    adjust_after_resize: "Tune visual style after resizing an image for export.",
    check_expected_status: "Check the HTTP status codes your generated request may return.",
    compare_after_formatting: "Compare the formatted payload with another JSON sample.",
    compare_base_encodings: "Switch between Base64, hex, and other encodings.",
    compare_regex_matches: "Compare matched and unmatched text after tuning a pattern.",
    compare_scrubbed_logs: "Review exactly what changed after redaction.",
    compare_token_hashes: "Compare token digests without storing token contents.",
    crop_before_resize: "Crop the source asset before resizing it for a target surface.",
    decode_url_payloads: "Decode URL tokens and query-string payloads after Base64 work.",
    decode_url_samples: "Decode URL-encoded samples before testing patterns.",
    draft_social_copy: "Draft social copy that matches the Open Graph metadata.",
    embed_resized_asset: "Convert the resized image into an embeddable Base64 asset.",
    encode_query_params: "Encode query parameters before adding them to generated requests.",
    explain_har_statuses: "Explain status codes found while reviewing a sanitized HAR.",
    fill_fixture_records: "Fill generated fixture rows with readable placeholder text.",
    format_converted_json: "Format converted JSON before reviewing or sharing it.",
    generate_test_credentials: "Generate local-only test credentials for fixture records.",
    hash_decoded_payload: "Hash decoded bytes for comparison or integrity checks.",
    inspect_certificate_material: "Inspect certificate material related to the public key.",
    inspect_converted_structure: "Visualize converted data as structured metadata.",
    inspect_decoded_token: "Inspect token segments after Base64 URL-safe decoding.",
    inspect_der_structure: "Inspect DER/ASN.1 structure behind certificate material.",
    inspect_encoded_bytes: "Inspect encoded bytes before hashing or conversion.",
    inspect_redacted_tokens: "Inspect redacted tokens without pasting them into a cloud service.",
    inspect_request_url: "Break down the request URL before generating client code.",
    inspect_token_segments: "Review Base64URL token segments before deeper JWT checks.",
    parse_after_redaction: "Parse cleaned logs after secrets and PII are removed.",
    query_formatted_json: "Run JSONPath queries against the formatted payload.",
    review_response_headers: "Review response headers captured in sanitized network logs.",
    scrub_followup_logs: "Scrub adjacent log snippets before sharing a debugging bundle.",
    stamp_seed_data: "Add timestamps alongside generated IDs for seed data.",
    test_extracted_json_paths: "Test patterns against extracted JSON snippets.",
    turn_copy_into_preview: "Turn social copy into a shareable preview image.",
    typed_model_from_converted_json: "Generate typed models from converted JSON.",
    typed_model_from_formatted_json: "Generate typed models from the formatted JSON.",
    verify_decoded_payload: "Hash decoded content to verify a shared payload.",
    verify_token_claims: "Move from decode-only inspection to claim review and verification.",
    verify_token_signatures: "Verify token signatures with related public key material.",
}

function getRelatedToolReason(toolKey: string, relatedToolKey: string, reasonKey?: string) {
    if (reasonKey && RELATED_TOOL_REASON_COPY[reasonKey]) {
        return RELATED_TOOL_REASON_COPY[reasonKey]
    }

    if (reasonKey) {
        return reasonKey.replace(/_/g, " ")
    }

    return `Continue from ${toolKey.replace(/_/g, " ")} with a related ${relatedToolKey.replace(/_/g, " ")} workflow.`
}

function getLocalizedRelatedToolReason({
    lang,
    labels,
    toolKey,
    relatedToolKey,
    reasonKey,
}: {
    lang: string
    labels: {
        related_tool_reason_generic?: string
        related_tool_reason_fallback?: string
    }
    toolKey: string
    relatedToolKey: string
    reasonKey?: string
}) {
    if (lang === "en") {
        return getRelatedToolReason(toolKey, relatedToolKey, reasonKey)
    }

    if (reasonKey) {
        return requireTranslationValue(labels.related_tool_reason_generic, "common.related_tool_reason_generic")
    }

    return requireTranslationValue(labels.related_tool_reason_fallback, "common.related_tool_reason_fallback")
}

/**
 * Displays 4-6 related tool cards at the bottom of a tool page.
 * Driven by the relatedTools array in each tool manifest.
 */
export function RelatedTools({
    toolKey,
    source = "inline",
}: {
    toolKey: string
    source?: "inline" | "fallback"
}) {
    const { t, lang } = useLang()
    const related = getDiscoveryRelatedTools(toolKey)
    const currentTool = getDiscoveryToolByKey(toolKey)
    const workflowByToolKey = new Map(currentTool?.relatedWorkflows.map((workflow) => [workflow.toolKey, workflow]) ?? [])

    if (related.length === 0) return null

    return (
        <div data-related-tools-source={source} className="mt-10 rounded-2xl border border-border/70 bg-card/55 p-4 backdrop-blur-sm sm:p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t.nav.related_tools}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((tool) => {
                    const toolTranslation = t.tools?.[tool.key]
                    const title = requireTranslationValue(toolTranslation?.title, `tools.${tool.key}.title`)
                    const desc = requireTranslationValue(toolTranslation?.description, `tools.${tool.key}.description`)
                    const workflow = workflowByToolKey.get(tool.key)
                    const reason = getLocalizedRelatedToolReason({
                        lang,
                        labels: t.common,
                        toolKey,
                        relatedToolKey: tool.key,
                        reasonKey: workflow?.reasonKey,
                    })

                    return (
                        <Link
                            key={tool.key}
                            href={`/${lang}/${tool.slug}`}
                            onClick={() => trackRelatedToolClick({
                                toolKey,
                                relatedToolKey: tool.key,
                                language: lang,
                                sourcePage: source === "fallback" ? "related_tools_fallback" : "related_tools_inline",
                            })}
                            className="group flex items-start gap-3 rounded-xl border border-border/70 bg-background/55 p-3 transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/30 hover:bg-accent/40"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                                    {title}
                                </div>
                                <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                    {desc}
                                </div>
                                <div className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-foreground/80">
                                    {reason}
                                </div>
                            </div>
                            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
