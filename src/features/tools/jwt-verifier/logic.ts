export type JwtClaimLabels = {
    exp: string
    nbf: string
    iat: string
    iss: string
    sub: string
    aud: string
}

export type JwtClaimCheck = {
    label: string
    status: "valid" | "invalid" | "info"
    value: string
}

const MIN_UNIX_SECONDS = 0
const MAX_UNIX_SECONDS = 253_402_300_799 // 9999-12-31T23:59:59Z

export function base64UrlDecode(str: string): Uint8Array {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/")
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes
}

export function base64UrlEncode(bytes: Uint8Array): string {
    let binary = ""
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function decodePayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".")
        if (parts.length !== 3) return null
        const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])))
        return payload
    } catch { return null }
}

export function decodeHeader(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".")
        if (parts.length !== 3) return null
        return JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])))
    } catch { return null }
}

export function parseUnixTimestampClaim(value: unknown): { ok: true; seconds: number; iso: string } | { ok: false; error: string } {
    if (typeof value === "boolean" || value === null || Array.isArray(value) || typeof value === "object") {
        return { ok: false, error: `invalid timestamp: ${String(value)}` }
    }

    const seconds = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(seconds)) {
        return { ok: false, error: `invalid timestamp: ${String(value)}` }
    }

    if (seconds < MIN_UNIX_SECONDS || seconds > MAX_UNIX_SECONDS) {
        return { ok: false, error: `timestamp out of range: ${String(value)}` }
    }

    const date = new Date(seconds * 1000)
    if (Number.isNaN(date.getTime())) {
        return { ok: false, error: `invalid timestamp: ${String(value)}` }
    }

    return { ok: true, seconds, iso: date.toISOString() }
}

function addTimestampClaimCheck(
    checks: JwtClaimCheck[],
    label: string,
    value: unknown,
    resolveStatus: (seconds: number) => JwtClaimCheck["status"],
): void {
    const parsed = parseUnixTimestampClaim(value)
    if (!parsed.ok) {
        checks.push({ label, status: "invalid", value: parsed.error })
        return
    }
    checks.push({ label, status: resolveStatus(parsed.seconds), value: parsed.iso })
}

export function checkClaims(payload: Record<string, unknown>, labels: JwtClaimLabels): JwtClaimCheck[] {
    const checks: JwtClaimCheck[] = []
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp !== undefined) {
        addTimestampClaimCheck(checks, labels.exp, payload.exp, (seconds) => seconds > now ? "valid" : "invalid")
    }
    if (payload.nbf !== undefined) {
        addTimestampClaimCheck(checks, labels.nbf, payload.nbf, (seconds) => seconds <= now ? "valid" : "invalid")
    }
    if (payload.iat !== undefined) {
        addTimestampClaimCheck(checks, labels.iat, payload.iat, () => "info")
    }
    if (payload.iss !== undefined) {
        checks.push({ label: labels.iss, status: "info", value: String(payload.iss) })
    }
    if (payload.sub !== undefined) {
        checks.push({ label: labels.sub, status: "info", value: String(payload.sub) })
    }
    if (payload.aud !== undefined) {
        checks.push({ label: labels.aud, status: "info", value: String(payload.aud) })
    }
    return checks
}
