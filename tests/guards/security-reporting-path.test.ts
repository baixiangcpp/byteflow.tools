import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const SECURITY_ADVISORY_URL = "https://github.com/baixiangcpp/byteflow.tools/security/advisories/new"
const SECURITY_POLICY_URL = "https://github.com/baixiangcpp/byteflow.tools/security/policy"

function read(path: string) {
    return readFileSync(path, "utf8")
}

describe("BF-045 security reporting path", () => {
    it("publishes a valid well-known security.txt with the private advisory contact", () => {
        const securityTxt = read("public/.well-known/security.txt")

        expect(securityTxt).toContain(`Contact: ${SECURITY_ADVISORY_URL}`)
        expect(securityTxt).toContain(`Policy: ${SECURITY_POLICY_URL}`)
        expect(securityTxt).toContain("Canonical: https://byteflow.tools/.well-known/security.txt")
        expect(securityTxt).toContain("Preferred-Languages: en")
        expect(securityTxt).toMatch(/Expires: 2027-06-24T00:00:00Z/)
        expect(securityTxt).not.toMatch(/mailto:|api[_-]?key|token|secret/i)
    })

    it("redirects the root security.txt path to the well-known file", () => {
        const redirects = read("public/_redirects")

        expect(redirects).toContain("/security.txt /.well-known/security.txt 301")
    })

    it("keeps repository security policy and public pages aligned", () => {
        const policy = read(".github/SECURITY.md")
        const contactPage = read("src/app/[lang]/contact/page.tsx")
        const trustCenterPage = read("src/app/[lang]/trust-center/page.tsx")
        const enCopy = read("src/core/i18n/translations/en.json")

        expect(policy).toContain(SECURITY_ADVISORY_URL)
        expect(policy).toContain("Do not open a public issue")
        expect(policy).toContain("Do not include production secrets")
        expect(contactPage).toContain(SECURITY_ADVISORY_URL)
        expect(contactPage).toContain("contact_security_title")
        expect(trustCenterPage).toContain(SECURITY_ADVISORY_URL)
        expect(trustCenterPage).toContain("/.well-known/security.txt")
        expect(enCopy).toContain("Use public issues only for non-security bugs or feature requests")
    })
})
