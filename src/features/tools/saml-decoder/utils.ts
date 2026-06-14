import { estimateBase64DecodedBytes, measureUtf8Bytes, PHASE4_LIMITS } from "@/core/utils/phase4-inspector-limits"

export interface SamlAttribute {
    name: string
    values: string[]
}

export interface SamlDecodedSummary {
    bindingHint: string
    rootElement: string
    issuer?: string
    nameId?: string
    destination?: string
    assertionId?: string
    audience?: string
    recipient?: string
    notBefore?: string
    notOnOrAfter?: string
    sessionNotOnOrAfter?: string
    attributes: SamlAttribute[]
    signatures: number
    certificates: number
}

export interface SamlDecodeResult {
    ok: boolean
    xml: string
    summary?: SamlDecodedSummary
    warnings: string[]
    error?: string
}

const SAML_RAW_INPUT_TOO_LARGE = "Input is too large for the local SAML decoder. Paste a smaller SAML snippet."
const SAML_DECODED_XML_TOO_LARGE = "Decoded SAML XML is too large for the local decoder."

function decodeBase64ToText(value: string): string {
    const compact = value.trim().replace(/\s+/g, "")
    if (estimateBase64DecodedBytes(compact) > PHASE4_LIMITS.maxSamlDecodedXmlBytes) {
        throw new Error(SAML_DECODED_XML_TOO_LARGE)
    }
    const padded = compact.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(compact.length / 4) * 4, "=")
    const binary = typeof atob === "function"
        ? atob(padded)
        : typeof Buffer !== "undefined"
            ? Buffer.from(padded, "base64").toString("binary")
            : ""
    const bytes = Uint8Array.from(Array.from(binary, (char) => char.charCodeAt(0)))
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes)
}

function assertDecodedXmlBudget(value: string): void {
    if (measureUtf8Bytes(value, PHASE4_LIMITS.maxSamlDecodedXmlBytes).exceeded) {
        throw new Error(SAML_DECODED_XML_TOO_LARGE)
    }
}

function extractSamlPayload(input: string): { payload: string; hint: string; warnings: string[] } {
    const trimmed = input.trim()
    const warnings: string[] = []
    if (trimmed.startsWith("<")) {
        assertDecodedXmlBudget(trimmed)
        return { payload: trimmed, hint: "Raw XML", warnings }
    }

    const querySource = trimmed.includes("?") ? trimmed.slice(trimmed.indexOf("?") + 1) : trimmed
    const params = new URLSearchParams(querySource)
    const paramValue = params.get("SAMLResponse") ?? params.get("SAMLRequest")
    if (paramValue) {
        const decoded = decodeBase64ToText(paramValue)
        assertDecodedXmlBudget(decoded)
        if (!decoded.trim().startsWith("<")) {
            warnings.push("HTTP-Redirect DEFLATE payloads are detected but not decompressed by this local MVP. Paste POST binding Base64 or raw XML instead.")
        }
        return { payload: decoded, hint: params.has("SAMLRequest") ? "SAMLRequest parameter" : "SAMLResponse parameter", warnings }
    }

    const decoded = decodeBase64ToText(trimmed)
    assertDecodedXmlBudget(decoded)
    return { payload: decoded, hint: "Base64 payload", warnings }
}

function firstText(doc: Document, localName: string): string | undefined {
    const node = Array.from(doc.getElementsByTagName("*")).find((item) => item.localName === localName)
    return node?.textContent?.trim() || undefined
}

function firstAttr(doc: Document, localName: string, attr: string): string | undefined {
    const node = Array.from(doc.getElementsByTagName("*")).find((item) => item.localName === localName)
    return node?.getAttribute(attr) || undefined
}

function countNodes(doc: Document, localName: string): number {
    return Array.from(doc.getElementsByTagName("*")).filter((item) => item.localName === localName).length
}

function getAttributes(doc: Document): SamlAttribute[] {
    return Array.from(doc.getElementsByTagName("*"))
        .filter((node) => node.localName === "Attribute")
        .slice(0, 100)
        .map((node) => ({
            name: node.getAttribute("Name") || node.getAttribute("FriendlyName") || "(unnamed)",
            values: Array.from(node.children)
                .filter((child) => child.localName === "AttributeValue")
                .map((child) => child.textContent?.trim() || "")
                .filter(Boolean),
        }))
}

export function decodeSaml(input: string): SamlDecodeResult {
    if (!input.trim()) {
        return { ok: false, xml: "", warnings: [], error: "Input is required." }
    }
    if (measureUtf8Bytes(input, PHASE4_LIMITS.maxSamlRawInputBytes).exceeded) {
        return { ok: false, xml: "", warnings: [], error: SAML_RAW_INPUT_TOO_LARGE }
    }

    try {
        const extracted = extractSamlPayload(input)
        const xml = extracted.payload.trim()
        if (!xml.startsWith("<")) {
            return {
                ok: false,
                xml,
                warnings: extracted.warnings,
                error: "Decoded payload is not XML. It may be compressed SAML Redirect binding data.",
            }
        }

        const doc = new DOMParser().parseFromString(xml, "application/xml")
        const parserError = doc.getElementsByTagName("parsererror")[0]
        if (parserError) {
            return { ok: false, xml, warnings: extracted.warnings, error: parserError.textContent?.trim() || "Unable to parse SAML XML." }
        }

        const root = doc.documentElement
        const assertion = Array.from(doc.getElementsByTagName("*")).find((node) => node.localName === "Assertion")
        return {
            ok: true,
            xml,
            warnings: extracted.warnings,
            summary: {
                bindingHint: extracted.hint,
                rootElement: root.localName,
                issuer: firstText(doc, "Issuer"),
                nameId: firstText(doc, "NameID"),
                destination: root.getAttribute("Destination") || undefined,
                assertionId: assertion?.getAttribute("ID") || undefined,
                audience: firstText(doc, "Audience"),
                recipient: firstAttr(doc, "SubjectConfirmationData", "Recipient"),
                notBefore: firstAttr(doc, "Conditions", "NotBefore"),
                notOnOrAfter: firstAttr(doc, "Conditions", "NotOnOrAfter"),
                sessionNotOnOrAfter: firstAttr(doc, "AuthnStatement", "SessionNotOnOrAfter"),
                attributes: getAttributes(doc),
                signatures: countNodes(doc, "Signature"),
                certificates: countNodes(doc, "X509Certificate"),
            },
        }
    } catch (error) {
        return {
            ok: false,
            xml: "",
            warnings: [],
            error: error instanceof Error ? error.message : "Unable to decode SAML payload.",
        }
    }
}
