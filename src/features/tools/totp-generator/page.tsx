"use client"

import * as React from "react"
import { KeyRound, Copy, RefreshCw, Timer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

// ─── TOTP Engine (RFC 6238) ─────────────────────────────────────────────────

function base32Decode(str: string): Uint8Array {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, "")
    let bits = ""
    for (const c of clean) {
        const val = alphabet.indexOf(c)
        if (val === -1) continue
        bits += val.toString(2).padStart(5, "0")
    }
    const bytes = new Uint8Array(Math.floor(bits.length / 8))
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2)
    }
    return bytes
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey("raw", key.buffer as ArrayBuffer, { name: "HMAC", hash: "SHA-1" }, false, ["sign"])
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, message.buffer as ArrayBuffer)
    return new Uint8Array(sig)
}

async function generateTOTP(secret: string, time: number, digits: number = 6, period: number = 30): Promise<string> {
    const key = base32Decode(secret)
    const counter = Math.floor(time / period)
    const counterBytes = new Uint8Array(8)
    let c = counter
    for (let i = 7; i >= 0; i--) {
        counterBytes[i] = c & 0xff
        c = Math.floor(c / 256)
    }

    const hash = await hmacSha1(key, counterBytes)
    const offset = hash[hash.length - 1] & 0x0f
    const binary = ((hash[offset] & 0x7f) << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]
    const otp = binary % Math.pow(10, digits)
    return otp.toString().padStart(digits, "0")
}

async function generateHOTP(secret: string, counter: number, digits: number = 6): Promise<string> {
    const key = base32Decode(secret)
    const counterBytes = new Uint8Array(8)
    let c = counter
    for (let i = 7; i >= 0; i--) {
        counterBytes[i] = c & 0xff
        c = Math.floor(c / 256)
    }

    const hash = await hmacSha1(key, counterBytes)
    const offset = hash[hash.length - 1] & 0x0f
    const binary = ((hash[offset] & 0x7f) << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]
    const otp = binary % Math.pow(10, digits)
    return otp.toString().padStart(digits, "0")
}

function generateRandomSecret(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    let secret = ""
    const bytes = crypto.getRandomValues(new Uint8Array(20))
    for (const b of bytes) secret += chars[b % 32]
    return secret
}

export function TotpGeneratorPage() {
    const { t } = useLang()
    const [secret, setSecret] = React.useState("JBSWY3DPEHPK3PXP")
    const [mode, setMode] = React.useState<"totp" | "hotp">("totp")
    const [digits, setDigits] = React.useState(6)
    const [period, setPeriod] = React.useState(30)
    const [counter, setCounter] = React.useState(0)
    const [otp, setOtp] = React.useState("")
    const [remaining, setRemaining] = React.useState(30)

    const generate = React.useCallback(async () => {
        if (!secret.trim()) { setOtp(""); return }
        try {
            if (mode === "totp") {
                const now = Math.floor(Date.now() / 1000)
                const code = await generateTOTP(secret, now, digits, period)
                setOtp(code)
                setRemaining(period - (now % period))
            } else {
                const code = await generateHOTP(secret, counter, digits)
                setOtp(code)
            }
        } catch { setOtp("ERROR") }
    }, [secret, mode, digits, period, counter])

    React.useEffect(() => { generate() }, [generate])

    // Auto-refresh TOTP
    React.useEffect(() => {
        if (mode !== "totp") return
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000)
            const rem = period - (now % period)
            setRemaining(rem)
            if (rem === period) generate()
        }, 1000)
        return () => clearInterval(interval)
    }, [mode, period, generate])

    const handleCopy = async () => {
        if (!otp || otp === "ERROR") return
        const result = await safeClipboardWrite(otp)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    const toolT = t.tools["totp_generator"] as Record<string, string>

    return (
        <div className="flex flex-col h-full space-y-6 max-w-3xl mx-auto w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <KeyRound className="h-6 w-6 text-primary" />
                    {toolT.title}
                </h1>
                <p className="text-muted-foreground mt-1">{toolT.description}</p>
            </div>

            <SensitiveInputWarning variant="secret" />

            {/* OTP Display */}
            <div className="p-8 border rounded-xl bg-card shadow-sm text-center space-y-4">
                <div className="text-5xl font-mono font-bold tracking-[0.3em] text-foreground">{otp || "------"}</div>
                {mode === "totp" && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        <span>{toolT.refreshes_in.replace("{seconds}", "")}<span className={`font-bold ${remaining <= 5 ? "text-red-500" : ""}`}>{remaining}s</span></span>
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden ml-2">
                            <div className="h-full bg-primary rounded-full transition-[width,background-color] duration-1000" style={{ width: `${(remaining / period) * 100}%` }} />
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => void handleCopy()}><Copy className="mr-2 h-4 w-4" />{t.common.copy}</Button>
                    <Button size="sm" variant="outline" onClick={() => void generate()}><RefreshCw className="mr-2 h-4 w-4" />{toolT.refresh}</Button>
                </div>
            </div>

            {/* Settings */}
            <div className="p-5 border rounded-lg bg-card shadow-sm space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.settings}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{toolT.mode}</label>
                        <div className="flex gap-2">
                            <Button variant={mode === "totp" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setMode("totp")}>TOTP</Button>
                            <Button variant={mode === "hotp" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setMode("hotp")}>HOTP</Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{toolT.digits}</label>
                        <div className="flex gap-2">
                            {[6, 8].map((d) => (
                                <Button key={d} variant={digits === d ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setDigits(d)}>{d}</Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">{toolT.secret_key}</label>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSecret(generateRandomSecret())}>{toolT.generate_random}</Button>
                    </div>
                    <Input className="font-mono text-sm tracking-wider" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="JBSWY3DPEHPK3PXP" />
                </div>

                {mode === "totp" ? (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{toolT.period}</label>
                        <Input type="number" min={15} max={120} value={period} onChange={(e) => setPeriod(Number(e.target.value))} />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">{toolT.counter}</label>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setCounter((c) => c + 1) }}>{toolT.increment}</Button>
                        </div>
                        <Input type="number" min={0} value={counter} onChange={(e) => setCounter(Number(e.target.value))} />
                    </div>
                )}
            </div>

            <RelatedTools toolKey="totp_generator" />
        </div>
    )
}
