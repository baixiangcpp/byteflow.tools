export type CidrCalculationResult = {
    input: string
    ipAddress: string
    prefixLength: number
    subnetMask: string
    wildcardMask: string
    networkAddress: string
    broadcastAddress: string
    firstHost: string
    lastHost: string
    totalAddresses: number
    usableHosts: number
    isPrivateRange: boolean
    addressClass: string
}

export type CidrParseResult =
    | { ok: true; value: CidrCalculationResult }
    | { ok: false; error: string }

function parseIpv4Address(value: string): number | null {
    const segments = value.split(".")
    if (segments.length !== 4) return null

    const octets = segments.map((segment) => Number(segment))
    if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
        return null
    }

    return (
        ((octets[0] << 24) >>> 0) +
        ((octets[1] << 16) >>> 0) +
        ((octets[2] << 8) >>> 0) +
        (octets[3] >>> 0)
    ) >>> 0
}

function intToIpv4(value: number): string {
    return [
        (value >>> 24) & 255,
        (value >>> 16) & 255,
        (value >>> 8) & 255,
        value & 255,
    ].join(".")
}

function getAddressClass(firstOctet: number): string {
    if (firstOctet >= 1 && firstOctet <= 126) return "A"
    if (firstOctet === 127) return "Loopback"
    if (firstOctet >= 128 && firstOctet <= 191) return "B"
    if (firstOctet >= 192 && firstOctet <= 223) return "C"
    if (firstOctet >= 224 && firstOctet <= 239) return "D (Multicast)"
    if (firstOctet >= 240 && firstOctet <= 255) return "E (Reserved)"
    return "Special"
}

function isPrivateRange(ipAsInt: number): boolean {
    const octet1 = (ipAsInt >>> 24) & 255
    const octet2 = (ipAsInt >>> 16) & 255

    if (octet1 === 10) return true
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true
    if (octet1 === 192 && octet2 === 168) return true
    return false
}

export function calculateCidr(value: string): CidrParseResult {
    const raw = value.trim()
    const match = raw.match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*\/\s*(\d{1,2})$/)
    if (!match) {
        return { ok: false, error: "CIDR must match IPv4/prefix (example: 192.168.1.42/24)." }
    }

    const ipText = match[1]
    const prefixLength = Number(match[2])
    if (!Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > 32) {
        return { ok: false, error: "Prefix length must be between 0 and 32." }
    }

    const ipAsInt = parseIpv4Address(ipText)
    if (ipAsInt === null) {
        return { ok: false, error: "Invalid IPv4 address." }
    }

    const subnetMaskInt = prefixLength === 0 ? 0 : (0xffffffff << (32 - prefixLength)) >>> 0
    const wildcardMaskInt = (~subnetMaskInt) >>> 0
    const networkAddressInt = (ipAsInt & subnetMaskInt) >>> 0
    const broadcastAddressInt = (networkAddressInt | wildcardMaskInt) >>> 0
    const totalAddresses = 2 ** (32 - prefixLength)

    let firstHostInt = networkAddressInt
    let lastHostInt = broadcastAddressInt
    let usableHosts = totalAddresses

    if (prefixLength <= 30) {
        firstHostInt = (networkAddressInt + 1) >>> 0
        lastHostInt = (broadcastAddressInt - 1) >>> 0
        usableHosts = totalAddresses - 2
    } else if (prefixLength === 31) {
        usableHosts = 2
    } else {
        usableHosts = 1
    }

    return {
        ok: true,
        value: {
            input: `${ipText}/${prefixLength}`,
            ipAddress: ipText,
            prefixLength,
            subnetMask: intToIpv4(subnetMaskInt),
            wildcardMask: intToIpv4(wildcardMaskInt),
            networkAddress: intToIpv4(networkAddressInt),
            broadcastAddress: intToIpv4(broadcastAddressInt),
            firstHost: intToIpv4(firstHostInt),
            lastHost: intToIpv4(lastHostInt),
            totalAddresses,
            usableHosts,
            isPrivateRange: isPrivateRange(ipAsInt),
            addressClass: getAddressClass((ipAsInt >>> 24) & 255),
        },
    }
}

export function formatCidrSummary(result: CidrCalculationResult): string {
    return [
        `Input: ${result.input}`,
        `IP Address: ${result.ipAddress}`,
        `Subnet Mask: ${result.subnetMask}`,
        `Wildcard Mask: ${result.wildcardMask}`,
        `Network Address: ${result.networkAddress}`,
        `Broadcast Address: ${result.broadcastAddress}`,
        `First Host: ${result.firstHost}`,
        `Last Host: ${result.lastHost}`,
        `Total Addresses: ${result.totalAddresses}`,
        `Usable Hosts: ${result.usableHosts}`,
        `Private Range: ${result.isPrivateRange ? "Yes" : "No"}`,
        `Address Class: ${result.addressClass}`,
    ].join("\n")
}
