"use client"

import * as React from "react"
import { Copy, KeyRound, RefreshCw, Timer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { SensitiveInputWarning } from "@/features/tool-shell/sensitive-input-warning"
import {
    MAX_HOTP_COUNTER,
    MAX_TOTP_PERIOD,
    MIN_TOTP_PERIOD,
    decodeBase32Strict,
    generateHOTP,
    generateRandomSecret,
    generateTOTP,
    parseHotpCounter,
    parseTotpPeriod,
} from "./logic"
import { startTotpTicker } from "./browser-actions"
import { ToolPageContainer } from "@/components/layout/page-container"

export function TotpGeneratorPage() {
    const { t } = useLang()
    const toolT = t.tools["totp_generator"] as Record<string, string>
    const [secret, setSecret] = React.useState("JBSWY3DPEHPK3PXP")
    const [mode, setMode] = React.useState<"totp" | "hotp">("totp")
    const [digits, setDigits] = React.useState(6)
    const [periodInput, setPeriodInput] = React.useState("30")
    const [counterInput, setCounterInput] = React.useState("0")
    const [otp, setOtp] = React.useState("")
    const [remaining, setRemaining] = React.useState(30)
    const [runtimeError, setRuntimeError] = React.useState<string | null>(null)
    const generationRequestRef = React.useRef(0)

    const secretValidation = React.useMemo(() => decodeBase32Strict(secret), [secret])
    const periodValidation = React.useMemo(() => parseTotpPeriod(periodInput), [periodInput])
    const counterValidation = React.useMemo(() => parseHotpCounter(counterInput), [counterInput])
    const secretError = secretValidation.ok ? null : toolT[`error_${secretValidation.errorCode}`]
    const periodError = periodValidation.ok ? null : toolT[`error_${periodValidation.errorCode}`]
    const counterError = counterValidation.ok ? null : toolT[`error_${counterValidation.errorCode}`]
    const activeValidationError = secretError || (mode === "totp" ? periodError : counterError)
    const [refreshPrefix, refreshSuffix = ""] = toolT.refreshes_in.split("{seconds}")

    const generate = React.useCallback(async () => {
        const requestId = ++generationRequestRef.current
        const hasNumericError = mode === "totp" ? !periodValidation.ok : !counterValidation.ok
        if (!secretValidation.ok || hasNumericError) {
            setOtp("")
            setRuntimeError(null)
            if (mode === "totp") setRemaining(periodValidation.ok ? periodValidation.value : 0)
            return
        }

        try {
            let code: string
            if (mode === "totp") {
                if (!periodValidation.ok) return
                const now = Math.floor(Date.now() / 1000)
                code = await generateTOTP(secret, now, digits, periodValidation.value)
                if (requestId !== generationRequestRef.current) return
                setRemaining(periodValidation.value - (now % periodValidation.value))
            } else {
                if (!counterValidation.ok) return
                code = await generateHOTP(secret, counterValidation.value, digits)
            }
            if (requestId !== generationRequestRef.current) return
            setOtp(code)
            setRuntimeError(null)
        } catch {
            if (requestId !== generationRequestRef.current) return
            setOtp("")
            setRuntimeError(toolT.error_generation_failed)
        }
    }, [counterValidation, digits, mode, periodValidation, secret, secretValidation, toolT.error_generation_failed])

    React.useEffect(() => {
        void generate()
    }, [generate])

    React.useEffect(() => {
        if (mode !== "totp" || !periodValidation.ok || !secretValidation.ok) return
        return startTotpTicker(() => {
            const now = Math.floor(Date.now() / 1000)
            const nextRemaining = periodValidation.value - (now % periodValidation.value)
            setRemaining(nextRemaining)
            if (nextRemaining === periodValidation.value) void generate()
        })
    }, [generate, mode, periodValidation, secretValidation])

    const handleCopy = async () => {
        if (!otp || activeValidationError || runtimeError) return
        const result = await safeClipboardWrite(otp)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    return (
        <div className="flex h-full w-full max-w-3xl flex-col space-y-6 mx-auto">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                    <KeyRound className="h-6 w-6 text-primary" />
                    {toolT.title}
                </h1>
                <p className="mt-1 text-muted-foreground">{toolT.description}</p>
            </div>

            <SensitiveInputWarning variant="secret" />

            <div className="space-y-4 rounded-xl border bg-card p-8 text-center shadow-sm">
                <div className="text-5xl font-mono font-bold tracking-[0.3em] text-foreground" aria-live="polite">
                    {otp || "------"}
                </div>
                {runtimeError && <p role="alert" className="text-sm text-destructive">{runtimeError}</p>}
                {mode === "totp" && periodValidation.ok && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        <span>
                            {refreshPrefix}
                            <span className={`font-bold ${remaining <= 5 ? "text-red-500" : ""}`}>{remaining}</span>
                            {refreshSuffix}
                        </span>
                        <div className="ml-2 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-[width,background-color] duration-1000"
                                style={{ width: `${(remaining / periodValidation.value) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleCopy()}
                        disabled={!otp || Boolean(activeValidationError) || Boolean(runtimeError)}
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        {t.common.copy}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void generate()}
                        disabled={Boolean(activeValidationError)}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {toolT.refresh}
                    </Button>
                </div>
            </div>

            <div className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{toolT.settings}</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <span className="text-sm font-medium">{toolT.mode}</span>
                        <div className="flex gap-2">
                            <Button variant={mode === "totp" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => {
                                generationRequestRef.current += 1
                                setMode("totp")
                            }}>TOTP</Button>
                            <Button variant={mode === "hotp" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => {
                                generationRequestRef.current += 1
                                setMode("hotp")
                            }}>HOTP</Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <span className="text-sm font-medium">{toolT.digits}</span>
                        <div className="flex gap-2">
                            {[6, 8].map((digitCount) => (
                                <Button
                                    key={digitCount}
                                    variant={digits === digitCount ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                        generationRequestRef.current += 1
                                        setDigits(digitCount)
                                    }}
                                >
                                    {digitCount}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="totp-secret" className="text-sm font-medium">{toolT.secret_key}</label>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                            generationRequestRef.current += 1
                            setSecret(generateRandomSecret())
                        }}>
                            {toolT.generate_random}
                        </Button>
                    </div>
                    <Input
                        id="totp-secret"
                        className="font-mono text-sm tracking-wider"
                        value={secret}
                        onChange={(event) => {
                            generationRequestRef.current += 1
                            setSecret(event.target.value)
                        }}
                        placeholder="JBSWY3DPEHPK3PXP"
                        aria-invalid={Boolean(secretError)}
                        aria-describedby={secretError ? "totp-secret-error" : undefined}
                    />
                    {secretError && <p id="totp-secret-error" role="alert" className="text-sm text-destructive">{secretError}</p>}
                </div>

                {mode === "totp" ? (
                    <div className="space-y-2">
                        <label htmlFor="totp-period" className="text-sm font-medium">{toolT.period}</label>
                        <Input
                            id="totp-period"
                            type="number"
                            min={MIN_TOTP_PERIOD}
                            max={MAX_TOTP_PERIOD}
                            step={1}
                            value={periodInput}
                            onChange={(event) => {
                                generationRequestRef.current += 1
                                setPeriodInput(event.target.value)
                            }}
                            aria-invalid={Boolean(periodError)}
                            aria-describedby={periodError ? "totp-period-error" : undefined}
                        />
                        {periodError && <p id="totp-period-error" role="alert" className="text-sm text-destructive">{periodError}</p>}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="hotp-counter" className="text-sm font-medium">{toolT.counter}</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={!counterValidation.ok || counterValidation.value >= MAX_HOTP_COUNTER}
                                onClick={() => {
                                    if (counterValidation.ok) {
                                        generationRequestRef.current += 1
                                        setCounterInput(String(counterValidation.value + 1))
                                    }
                                }}
                            >
                                {toolT.increment}
                            </Button>
                        </div>
                        <Input
                            id="hotp-counter"
                            type="number"
                            min={0}
                            max={MAX_HOTP_COUNTER}
                            step={1}
                            value={counterInput}
                            onChange={(event) => {
                                generationRequestRef.current += 1
                                setCounterInput(event.target.value)
                            }}
                            aria-invalid={Boolean(counterError)}
                            aria-describedby={counterError ? "hotp-counter-error" : undefined}
                        />
                        {counterError && <p id="hotp-counter-error" role="alert" className="text-sm text-destructive">{counterError}</p>}
                    </div>
                )}
            </div>

            <RelatedTools toolKey="totp_generator" />
        </div>
    )
}
