import { describe, expect, it } from "vitest"
import { parseAsn1Der } from "../../src/lib/asn1-der-inspector-utils"
import { inspectBytes, parseHexBytes } from "../../src/lib/hex-bytes-workbench-utils"
import { PHASE4_LIMITS } from "../../src/lib/phase4-inspector-limits"
import { decodeSaml } from "../../src/lib/saml-decoder-utils"
import { inspectUnicode } from "../../src/lib/unicode-inspector-utils"

function toBase64(value: string): string {
    return btoa(value)
}

describe("Phase 4 utilities", () => {
    it("inspects text as bytes and produces hex, Base64, and rows", () => {
        const result = inspectBytes("Hi", "text")

        expect(result.ok).toBe(true)
        expect(result.compactHex).toBe("4869")
        expect(result.base64).toBe("SGk=")
        expect(result.rows).toEqual([
            expect.objectContaining({ offset: 0, hex: "48", decimal: 72, ascii: "H" }),
            expect.objectContaining({ offset: 1, hex: "69", decimal: 105, ascii: "i" }),
        ])
    })

    it("rejects odd-length hex input", () => {
        expect(() => parseHexBytes("ABC")).toThrow(/even number/)
        expect(inspectBytes("ABC", "hex").ok).toBe(false)
    })

    it("inspects Unicode code points without UTF-16 emoji drift", () => {
        const result = inspectUnicode("A\u0301\u200B🔒")

        expect(result.stats.codePoints).toBe(4)
        expect(result.stats.utf16Units).toBe(5)
        expect(result.stats.combiningMarks).toBe(1)
        expect(result.stats.invisible).toBe(1)
        expect(result.characters[3]).toMatchObject({
            index: 3,
            utf16Index: 3,
            codePoint: "U+01F512",
        })
    })

    it("decodes Base64 SAML response and summarizes assertion fields", () => {
        const xml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Destination="https://sp.example.com/acs">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">https://idp.example.com</saml:Issuer>
  <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_a">
    <saml:Subject><saml:NameID>alice@example.com</saml:NameID><saml:SubjectConfirmation><saml:SubjectConfirmationData Recipient="https://sp.example.com/acs" /></saml:SubjectConfirmation></saml:Subject>
    <saml:Conditions NotBefore="2026-06-10T10:00:00Z" NotOnOrAfter="2026-06-10T11:00:00Z"><saml:AudienceRestriction><saml:Audience>https://sp.example.com</saml:Audience></saml:AudienceRestriction></saml:Conditions>
    <saml:AttributeStatement><saml:Attribute Name="role"><saml:AttributeValue>admin</saml:AttributeValue></saml:Attribute></saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`
        const result = decodeSaml(toBase64(xml))

        expect(result.ok).toBe(true)
        expect(result.summary).toMatchObject({
            issuer: "https://idp.example.com",
            nameId: "alice@example.com",
            audience: "https://sp.example.com",
            recipient: "https://sp.example.com/acs",
        })
        expect(result.summary?.attributes[0]).toEqual({ name: "role", values: ["admin"] })
    })

    it("returns a structured error for non-XML SAML payloads", () => {
        const result = decodeSaml(toBase64("not xml"))

        expect(result.ok).toBe(false)
        expect(result.error).toMatch(/not XML/)
    })

    it("rejects SAML raw input over the local budget", () => {
        const result = decodeSaml("A".repeat(PHASE4_LIMITS.maxSamlRawInputBytes + 1))

        expect(result.ok).toBe(false)
        expect(result.error).toMatch(/too large/)
        expect(result.summary).toBeUndefined()
    })

    it("rejects decoded SAML XML over the local budget before summary parsing", () => {
        const oversizedXml = `<samlp:Response>${"A".repeat(PHASE4_LIMITS.maxSamlDecodedXmlBytes + 1)}</samlp:Response>`
        const result = decodeSaml(toBase64(oversizedXml))

        expect(result.ok).toBe(false)
        expect(result.error).toMatch(/Decoded SAML XML is too large/)
        expect(result.summary).toBeUndefined()
    })

    it("parses nested ASN.1 DER sequence and decodes OID preview", () => {
        const result = parseAsn1Der("30 0D 02 01 05 06 08 2A 86 48 86 F7 0D 01 01")

        expect(result.ok).toBe(true)
        expect(result.nodes[0]).toMatchObject({ tagName: "SEQUENCE", constructed: true, length: 13 })
        expect(result.nodes[0].children[0]).toMatchObject({ tagName: "INTEGER", valuePreview: "5" })
        expect(result.nodes[0].children[1]).toMatchObject({ tagName: "OBJECT IDENTIFIER", valuePreview: "1.2.840.113549.1.1" })
    })

    it("applies ASN.1 max node truncation", () => {
        const result = parseAsn1Der("30 0D 02 01 05 06 08 2A 86 48 86 F7 0D 01 01", { maxNodes: 1 })

        expect(result.ok).toBe(true)
        expect(result.truncated).toBe(true)
        expect(result.maxNodesReached).toBe(true)
    })

    it("rejects ASN.1 raw input over the local budget", () => {
        const result = parseAsn1Der("A".repeat(PHASE4_LIMITS.maxAsn1RawInputBytes + 1))

        expect(result.ok).toBe(false)
        expect(result.error).toMatch(/Input is too large/)
    })

    it("rejects decoded ASN.1 DER bytes over the local budget", () => {
        const oversizedBase64 = btoa(String.fromCharCode(255).repeat(PHASE4_LIMITS.maxAsn1DecodedBytes + 1))
        const result = parseAsn1Der(oversizedBase64)

        expect(result.ok).toBe(false)
        expect(result.error).toMatch(/Decoded DER payload is too large/)
    })

    it("truncates Hex/Bytes rows without dropping byte stats", () => {
        const result = inspectBytes("A".repeat(PHASE4_LIMITS.maxHexBytesRows + 10), "text")

        expect(result.ok).toBe(true)
        expect(result.truncated).toBe(true)
        expect(result.rows).toHaveLength(PHASE4_LIMITS.maxHexBytesRows)
        expect(result.stats.byteLength).toBe(PHASE4_LIMITS.maxHexBytesRows + 10)
    })

    it("rejects Hex/Bytes raw input over the local budget", () => {
        const result = inspectBytes("A".repeat(PHASE4_LIMITS.maxHexBytesRawInputBytes + 1), "text")

        expect(result.ok).toBe(false)
        expect(result.error).toMatch(/too large/)
        expect(result.rows).toHaveLength(0)
    })

    it("truncates Unicode character rows at the local character budget", () => {
        const result = inspectUnicode("A".repeat(PHASE4_LIMITS.maxUnicodeCharacters + 10))

        expect(result.truncated).toBe(true)
        expect(result.characters).toHaveLength(PHASE4_LIMITS.maxUnicodeCharacters)
        expect(result.stats.codePoints).toBe(PHASE4_LIMITS.maxUnicodeCharacters)
        expect(result.stats.inspectedOnly).toBe(true)
    })

    it("does not fully inspect Unicode raw input over the local byte budget", () => {
        const result = inspectUnicode("A".repeat(PHASE4_LIMITS.maxUnicodeInputBytes + 10))

        expect(result.truncated).toBe(true)
        expect(result.characters.length).toBeLessThanOrEqual(PHASE4_LIMITS.maxUnicodeCharacters)
        expect(result.stats.inspectedOnly).toBe(true)
    })
})
