import { describe, expect, it } from "vitest"
import { PHASE4_LIMITS } from "@/core/utils/phase4-inspector-limits"
import { decodeSaml } from "@/features/tools/saml-decoder/utils"

const SAMPLE_SAML = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Destination="https://sp.example.com/acs">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">https://idp.example.com</saml:Issuer>
  <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_abc">
    <saml:Subject>
      <saml:NameID>user@example.com</saml:NameID>
      <saml:SubjectConfirmation>
        <saml:SubjectConfirmationData Recipient="https://sp.example.com/acs" />
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="2026-01-01T00:00:00Z" NotOnOrAfter="2026-01-01T01:00:00Z">
      <saml:AudienceRestriction>
        <saml:Audience>byteflow-tools</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AttributeStatement>
      <saml:Attribute Name="role"><saml:AttributeValue>admin</saml:AttributeValue></saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`

function toBase64(value: string): string {
    return Buffer.from(value, "utf8").toString("base64")
}

describe("saml decoder utils", () => {
    it("summarizes raw XML SAML responses", () => {
        const result = decodeSaml(SAMPLE_SAML)

        expect(result.ok).toBe(true)
        expect(result.summary).toMatchObject({
            bindingHint: "Raw XML",
            rootElement: "Response",
            issuer: "https://idp.example.com",
            nameId: "user@example.com",
            destination: "https://sp.example.com/acs",
            assertionId: "_abc",
            audience: "byteflow-tools",
            recipient: "https://sp.example.com/acs",
        })
        expect(result.summary?.attributes).toEqual([{ name: "role", values: ["admin"] }])
    })

    it("decodes POST-binding base64 and URL query payloads", () => {
        const encoded = toBase64(SAMPLE_SAML)

        expect(decodeSaml(encoded).summary?.bindingHint).toBe("Base64 payload")
        expect(decodeSaml(`https://idp.example.com/sso?SAMLResponse=${encodeURIComponent(encoded)}`).summary?.bindingHint).toBe("SAMLResponse parameter")
        expect(decodeSaml(`SAMLRequest=${encodeURIComponent(encoded)}`).summary?.bindingHint).toBe("SAMLRequest parameter")
    })

    it("returns malformed input errors without throwing", () => {
        const result = decodeSaml("not saml")

        expect(result.ok).toBe(false)
        expect(result.error).toMatch(/not XML|decode|parse|payload/i)
    })

    it("rejects raw inputs above the local budget before decoding", () => {
        const result = decodeSaml("A".repeat(PHASE4_LIMITS.maxSamlRawInputBytes + 1))

        expect(result.ok).toBe(false)
        expect(result.error).toContain("too large")
    })
})
