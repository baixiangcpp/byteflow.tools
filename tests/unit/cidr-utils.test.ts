import { describe, expect, it } from "vitest"
import { calculateCidr, formatCidrSummary } from "@/features/tools/cidr-subnet-calculator/utils"

describe("cidr utils", () => {
    it("calculates standard /24 subnet details", () => {
        const result = calculateCidr("192.168.1.42/24")
        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.networkAddress).toBe("192.168.1.0")
        expect(result.value.broadcastAddress).toBe("192.168.1.255")
        expect(result.value.firstHost).toBe("192.168.1.1")
        expect(result.value.lastHost).toBe("192.168.1.254")
        expect(result.value.totalAddresses).toBe(256)
        expect(result.value.usableHosts).toBe(254)
        expect(result.value.isPrivateRange).toBe(true)
        expect(result.value.addressClass).toBe("C")
    })

    it("handles /31 point-to-point networks", () => {
        const result = calculateCidr("203.0.113.10/31")
        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.networkAddress).toBe("203.0.113.10")
        expect(result.value.broadcastAddress).toBe("203.0.113.11")
        expect(result.value.firstHost).toBe("203.0.113.10")
        expect(result.value.lastHost).toBe("203.0.113.11")
        expect(result.value.usableHosts).toBe(2)
    })

    it("handles /32 single-host networks", () => {
        const result = calculateCidr("8.8.8.8/32")
        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.networkAddress).toBe("8.8.8.8")
        expect(result.value.broadcastAddress).toBe("8.8.8.8")
        expect(result.value.firstHost).toBe("8.8.8.8")
        expect(result.value.lastHost).toBe("8.8.8.8")
        expect(result.value.totalAddresses).toBe(1)
        expect(result.value.usableHosts).toBe(1)
        expect(result.value.addressClass).toBe("A")
    })

    it("rejects invalid CIDR input", () => {
        const invalidPrefix = calculateCidr("192.168.1.1/33")
        expect(invalidPrefix.ok).toBe(false)

        const invalidIp = calculateCidr("300.1.1.1/24")
        expect(invalidIp.ok).toBe(false)

        const malformed = calculateCidr("192.168.1.1")
        expect(malformed.ok).toBe(false)
    })

    it("formats human-readable copy summary", () => {
        const result = calculateCidr("10.0.0.15/24")
        expect(result.ok).toBe(true)
        if (!result.ok) return

        const summary = formatCidrSummary(result.value)
        expect(summary).toContain("Input: 10.0.0.15/24")
        expect(summary).toContain("Network Address: 10.0.0.0")
        expect(summary).toContain("Private Range: Yes")
    })
})
