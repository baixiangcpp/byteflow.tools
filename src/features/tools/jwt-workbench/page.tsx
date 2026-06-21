"use client"

import * as React from "react"
import {
    ShieldCheck,
    Eraser,
    Play,
    KeyRound,
    CheckCircle,
    XCircle,
    Copy,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { readStorageString, writeStorageString } from "@/core/storage/tool-persistence"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ALGORITHM_STORAGE_KEY } from "./constants"
import { decodeJsonSegment, encodeJsonSegment, safeJsonStringify, signHmac } from "./logic"
import { SAMPLE_HEADER, SAMPLE_PAYLOAD } from "./samples"
import type { JwtAlg } from "./types"

const ICON_BUTTON_CLASS =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-accent/50"

async function loadToast() {
    const { toast } = await import("sonner")
    return toast
}

export function JwtWorkbenchPage() {
    const { t } = useLang()
    const toolT = t.tools["jwt_workbench"] as Record<string, string>
    const text = React.useCallback((key: string) => toolT[key], [toolT])
    const notifyError = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.error(message)
    }, [])
    const notifySuccess = React.useCallback(async (message: string) => {
        const toast = await loadToast()
        toast.success(message)
    }, [])
    const [token, setToken] = React.useState("")
    const [secret, setSecret] = React.useState("")
    const [algorithm, setAlgorithm] = React.useState<JwtAlg>("HS256")
    const [headerInput, setHeaderInput] = React.useState(SAMPLE_HEADER)
    const [payloadInput, setPayloadInput] = React.useState(SAMPLE_PAYLOAD)
    const [decodedHeader, setDecodedHeader] = React.useState("")
    const [decodedPayload, setDecodedPayload] = React.useState("")
    const [verifyState, setVerifyState] = React.useState<"valid" | "invalid" | null>(null)
    const [statusText, setStatusText] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)

    const getJwtErrorMessage = React.useCallback((
        sourceError: unknown,
        context: "decode" | "encode" | "verify",
    ) => {
        const message = sourceError instanceof Error ? sourceError.message : ""
        if (message.includes("3 segments")) {
            return text("error_segments")
        }
        if (message.includes("Unsupported algorithm")) {
            return text("error_unsupported_algorithm")
        }
        if (message.includes("JSON")) {
            return text("error_invalid_json")
        }

        if (context === "decode") {
            return text("error_decode_failed")
        }
        if (context === "encode") {
            return text("error_encode_failed")
        }
        return text("error_verify_failed")
    }, [text])

    const clearAll = () => {
        setToken("")
        setSecret("")
        setAlgorithm("HS256")
        setHeaderInput(SAMPLE_HEADER)
        setPayloadInput(SAMPLE_PAYLOAD)
        setDecodedHeader("")
        setDecodedPayload("")
        setVerifyState(null)
        setStatusText("")
        setError(null)
    }

    React.useEffect(() => {
        const savedAlgorithm = readStorageString(ALGORITHM_STORAGE_KEY)
        if (savedAlgorithm === "HS256" || savedAlgorithm === "HS384" || savedAlgorithm === "HS512") {
            setAlgorithm(savedAlgorithm)
        }
    }, [])

    React.useEffect(() => {
        writeStorageString(ALGORITHM_STORAGE_KEY, algorithm)
    }, [algorithm])

    const decodeToken = () => {
        if (!token.trim()) {
            setDecodedHeader("")
            setDecodedPayload("")
            setVerifyState(null)
            setStatusText("")
            setError(null)
            return
        }

        try {
            const parts = token.split(".")
            if (parts.length !== 3) {
                throw new Error("JWT must contain 3 segments.")
            }
            const header = decodeJsonSegment(parts[0]) as Record<string, unknown>
            const payload = decodeJsonSegment(parts[1]) as Record<string, unknown>
            const nextAlg = (header.alg as JwtAlg) || "HS256"

            if (nextAlg === "HS256" || nextAlg === "HS384" || nextAlg === "HS512") {
                setAlgorithm(nextAlg)
            }

            setDecodedHeader(safeJsonStringify(header))
            setDecodedPayload(safeJsonStringify(payload))
            setHeaderInput(safeJsonStringify(header))
            setPayloadInput(safeJsonStringify(payload))
            setVerifyState(null)
            setStatusText(text("decoded_ok"))
            setError(null)
        } catch (err: unknown) {
            setDecodedHeader("")
            setDecodedPayload("")
            setVerifyState(null)
            setStatusText("")
            setError(getJwtErrorMessage(err, "decode"))
        }
    }

    const encodeToken = async () => {
        try {
            const header = JSON.parse(headerInput) as Record<string, unknown>
            const payload = JSON.parse(payloadInput) as Record<string, unknown>

            const alg: JwtAlg = algorithm
            const normalizedHeader = {
                ...header,
                alg,
                typ: header.typ || "JWT",
            }

            const headerSegment = encodeJsonSegment(normalizedHeader)
            const payloadSegment = encodeJsonSegment(payload)
            const signingInput = `${headerSegment}.${payloadSegment}`
            const signature = await signHmac(signingInput, secret, alg)
            const signedToken = `${signingInput}.${signature}`

            setToken(signedToken)
            setDecodedHeader(safeJsonStringify(normalizedHeader))
            setDecodedPayload(safeJsonStringify(payload))
            setVerifyState(null)
            setStatusText(text("encoded_ok").replace("{alg}", alg))
            setError(null)
        } catch (err: unknown) {
            setVerifyState(null)
            setStatusText("")
            setError(getJwtErrorMessage(err, "encode"))
        }
    }

    const verifyToken = async () => {
        if (!token.trim() || !secret.trim()) {
            setVerifyState(null)
            setStatusText("")
            return
        }

        try {
            const parts = token.split(".")
            if (parts.length !== 3) {
                throw new Error("JWT must contain 3 segments.")
            }

            const header = decodeJsonSegment(parts[0]) as Record<string, unknown>
            const alg = (header.alg as JwtAlg) || algorithm
            if (alg !== "HS256" && alg !== "HS384" && alg !== "HS512") {
                throw new Error(`Unsupported algorithm: ${header.alg || "unknown"}`)
            }

            const expectedSig = await signHmac(`${parts[0]}.${parts[1]}`, secret, alg)
            const valid = expectedSig === parts[2]

            setAlgorithm(alg)
            setVerifyState(valid ? "valid" : "invalid")
            setStatusText(
                valid
                    ? text("verify_valid").replace("{alg}", alg)
                    : text("verify_invalid").replace("{alg}", alg),
            )
            setError(null)
        } catch (err: unknown) {
            setVerifyState(null)
            setStatusText("")
            setError(getJwtErrorMessage(err, "verify"))
        }
    }

    const copyToken = async () => {
        if (!token) return
        const result = await safeClipboardWrite(token)
        if (!result.ok) {
            await notifyError(t.common.copy_failed)
            return
        }
        await notifySuccess(t.common.copied)
    }

    const actions: ToolAction[] = [
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: clearAll,
        },
        {
            id: "decode",
            label: toolT.decode_action,
            icon: Play,
            onClick: decodeToken,
        },
        {
            id: "verify",
            label: toolT.verify_action,
            icon: KeyRound,
            onClick: verifyToken,
        },
        {
            id: "encode",
            label: toolT.encode_action,
            icon: ShieldCheck,
            onClick: () => { void encodeToken() },
            variant: "default",
        },
    ]

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        {text("title")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {text("description")}
                    </p>
                </div>

                <ToolActionBar actions={actions} />
            </div>

            {error ? (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            {statusText ? (
                <div className={`rounded-md px-3 py-2 text-sm ${
                    verifyState === "valid"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : verifyState === "invalid"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : "bg-muted/60 text-muted-foreground"
                }`}>
                    <span className="inline-flex items-center gap-2">
                        {verifyState === "valid" ? <CheckCircle className="h-4 w-4" /> : null}
                        {verifyState === "invalid" ? <XCircle className="h-4 w-4" /> : null}
                        {statusText}
                    </span>
                </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">{toolT.token_input}</label>
                            <button type="button" className={ICON_BUTTON_CLASS} onClick={() => void copyToken()} disabled={!token}>
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">{`${t.common.copy} ${toolT.token_input}`}</span>
                            </button>
                        </div>
                        <Textarea
                            value={token}
                            onChange={(event) => setToken(event.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
                            className="min-h-[140px] font-mono text-xs leading-5"
                            aria-label={toolT.token_input}
                            spellCheck={false}
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{toolT.algorithm}</label>
                            <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as JwtAlg)}>
                                <SelectTrigger className="w-full" aria-label={toolT.algorithm}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="HS256">HS256</SelectItem>
                                    <SelectItem value="HS384">HS384</SelectItem>
                                    <SelectItem value="HS512">HS512</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{toolT.secret_input}</label>
                            <Input
                                type="password"
                                autoComplete="off"
                                value={secret}
                                onChange={(event) => setSecret(event.target.value)}
                                placeholder={toolT.secret_placeholder}
                                className="font-mono text-sm"
                                aria-label={toolT.secret_input}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{toolT.header_input}</label>
                        <Textarea
                            value={headerInput}
                            onChange={(event) => setHeaderInput(event.target.value)}
                            className="min-h-[120px] font-mono text-xs leading-5"
                            aria-label={toolT.header_input}
                            spellCheck={false}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{toolT.payload_input}</label>
                        <Textarea
                            value={payloadInput}
                            onChange={(event) => setPayloadInput(event.target.value)}
                            className="min-h-[140px] font-mono text-xs leading-5"
                            aria-label={toolT.payload_input}
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2 rounded-lg border bg-card p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {toolT.decoded_header}
                    </h3>
                    <pre className="min-h-[120px] overflow-auto rounded bg-muted/60 p-3 font-mono text-xs">
                        {decodedHeader || "-"}
                    </pre>
                </div>
                <div className="space-y-2 rounded-lg border bg-card p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {toolT.decoded_payload}
                    </h3>
                    <pre className="min-h-[120px] overflow-auto rounded bg-muted/60 p-3 font-mono text-xs">
                        {decodedPayload || "-"}
                    </pre>
                </div>
            </div>

            <RelatedTools toolKey="jwt_workbench" />
        </div>
    )
}
