"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { loader, type DiffEditorProps, type EditorProps } from "@monaco-editor/react"
import { useLang } from "@/core/i18n/lang-provider"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { getByteflowMonacoThemeName } from "@/core/utils/monaco-theme"
import { cn } from "@/core/utils/utils"

const MOBILE_EDITOR_MEDIA_QUERY = "(max-width: 768px)"
const MONACO_LOADER_TIMEOUT_MS = 5000
const MONACO_EDITOR_MIN_HEIGHT_PX = 220

let monacoLoaderConfigPromise: Promise<void> | null = null

function ensureMonacoLoaderConfigured() {
    if (typeof window === "undefined") return Promise.resolve()
    if (monacoLoaderConfigPromise) return monacoLoaderConfigPromise

    monacoLoaderConfigPromise = import("monaco-editor").then((monaco) => {
        // Force Monaco to use bundled local assets instead of remote CDN loader scripts.
        loader.config({ monaco })
    })

    return monacoLoaderConfigPromise
}

type MonacoLoaderState = "loading" | "ready" | "fallback"
type DesktopMonacoActivation = "deferred" | "activating" | "ready"

function useMonacoLoaderState(enabled: boolean): MonacoLoaderState {
    const [state, setState] = React.useState<MonacoLoaderState>(enabled ? "loading" : "fallback")

    React.useEffect(() => {
        if (!enabled) {
            setState("fallback")
            return
        }

        let active = true
        let settled = false
        setState("loading")

        const timeoutId = window.setTimeout(() => {
            if (!active || settled) return
            setState("fallback")
        }, MONACO_LOADER_TIMEOUT_MS)

        ensureMonacoLoaderConfigured()
            .then(() => {
                settled = true
                if (active) setState("ready")
            })
            .catch(() => {
                settled = true
                // Keep tools usable by degrading to textarea fallback if Monaco setup fails.
                if (active) setState("fallback")
            })

        return () => {
            active = false
            window.clearTimeout(timeoutId)
        }
    }, [enabled])

    return state
}

function EditorLoadingFallback() {
    const { t } = useLang()

    return (
        <div className="flex h-full min-h-[200px] w-full items-center justify-center text-sm text-muted-foreground">
            {t.common.loading_editor}
        </div>
    )
}

function useDesktopMonacoActivation(enabled = true): [DesktopMonacoActivation, () => void] {
    const [activation, setActivation] = React.useState<DesktopMonacoActivation>(enabled ? "deferred" : "ready")

    React.useEffect(() => {
        if (!enabled) {
            setActivation("ready")
            return
        }

        setActivation((current) => (current === "ready" ? current : "deferred"))
    }, [enabled])

    const activate = React.useCallback(() => {
        if (!enabled) return
        setActivation((current) => (current === "ready" ? current : "activating"))
    }, [enabled])

    return [activation, activate]
}

function useMobileEditorFallback(): boolean {
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return
        }

        const mediaQuery = window.matchMedia(MOBILE_EDITOR_MEDIA_QUERY)
        const update = () => setIsMobile(mediaQuery.matches)

        update()
        mediaQuery.addEventListener("change", update)
        return () => mediaQuery.removeEventListener("change", update)
    }, [])

    return isMobile
}

function isPercentageHeight(height?: EditorProps["height"]) {
    return typeof height === "string" && height.trim().endsWith("%")
}

function resolveEditorHeight(height?: EditorProps["height"]): string | number {
    if (typeof height === "number") return `${height}px`
    return height || "100%"
}

function useResolvedMonacoHeight(height?: EditorProps["height"], enabled = true) {
    const [hostElement, setHostElement] = React.useState<HTMLDivElement | null>(null)
    const hostRef = React.useCallback((node: HTMLDivElement | null) => {
        setHostElement(node)
    }, [])
    const [resolvedHeight, setResolvedHeight] = React.useState<string | number>(() => {
        if (isPercentageHeight(height)) return `${MONACO_EDITOR_MIN_HEIGHT_PX}px`
        return resolveEditorHeight(height)
    })

    React.useEffect(() => {
        if (!enabled) return

        if (!isPercentageHeight(height)) {
            setResolvedHeight(resolveEditorHeight(height))
            return
        }

        const parent = hostElement?.parentElement
        if (!parent) {
            setResolvedHeight(`${MONACO_EDITOR_MIN_HEIGHT_PX}px`)
            return
        }

        const update = () => {
            const inlineHeight = Number.parseFloat(parent.style.height || "")
            const parentHeight =
                parent.clientHeight ||
                parent.getBoundingClientRect().height ||
                (Number.isFinite(inlineHeight) ? inlineHeight : 0)
            const nextHeight =
                parentHeight > 0
                    ? `${Math.floor(parentHeight)}px`
                    : `${MONACO_EDITOR_MIN_HEIGHT_PX}px`
            setResolvedHeight((prev) => (prev === nextHeight ? prev : nextHeight))
        }

        update()

        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(update)
        observer.observe(parent)
        return () => observer.disconnect()
    }, [enabled, height, hostElement])

    return { hostRef, resolvedHeight }
}

const DynamicMonacoEditor = dynamic<EditorProps>(
    () => import("@monaco-editor/react").then((mod) => mod.default),
    {
        ssr: false,
        loading: () => <EditorLoadingFallback />,
    },
)

const DynamicMonacoDiffEditor = dynamic<DiffEditorProps>(
    () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
    {
        ssr: false,
        loading: () => <EditorLoadingFallback />,
    },
)

export function MonacoEditor(props: EditorProps) {
    const { t } = useLang()
    const { className, ...editorProps } = props
    const { resolvedTheme } = useThemePreference()
    const monacoTheme = props.theme || getByteflowMonacoThemeName(resolvedTheme)

    const isMobile = useMobileEditorFallback()
    const [desktopActivation, activateDesktopMonaco] = useDesktopMonacoActivation(!isMobile)
    const [fallbackFocused, setFallbackFocused] = React.useState(false)
    const shouldLoadMonaco = !isMobile && desktopActivation !== "deferred"
    const loaderState = useMonacoLoaderState(shouldLoadMonaco)
    const { hostRef, resolvedHeight } = useResolvedMonacoHeight(props.height, shouldLoadMonaco && loaderState !== "loading")
    const monacoOptions = React.useMemo(
        () => ({
            ...props.options,
            ariaLabel: props.options?.ariaLabel || t.common.code_editor,
            editContext: props.options?.editContext ?? false,
        }),
        [props.options, t.common.code_editor],
    )
    const shouldRenderDesktopMonaco =
        !isMobile
        && desktopActivation !== "deferred"
        && loaderState === "ready"
        && !fallbackFocused

    if (shouldRenderDesktopMonaco) {
        return (
            <div ref={hostRef} className={cn("h-full w-full", className)}>
                <DynamicMonacoEditor {...editorProps} theme={monacoTheme} options={monacoOptions} height={resolvedHeight} />
            </div>
        )
    }

    const readOnly = Boolean(props.options?.readOnly)
    const value = props.value ?? props.defaultValue ?? ""

    return (
        <textarea
            value={value}
            readOnly={readOnly}
            spellCheck={false}
            aria-label={monacoOptions.ariaLabel}
            onChange={(event) => props.onChange?.(event.target.value, undefined as never)}
            onFocus={() => {
                setFallbackFocused(true)
                activateDesktopMonaco()
            }}
            onBlur={() => setFallbackFocused(false)}
            onPointerDown={() => {
                setFallbackFocused(true)
                activateDesktopMonaco()
            }}
            className={cn(
                "h-full w-full resize-none border-0 bg-background p-3 font-mono text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
                readOnly ? "cursor-default text-muted-foreground" : "",
                className,
            )}
            style={{ height: resolveEditorHeight(props.height), minHeight: 220 }}
        />
    )
}

export type MonacoDiffEditorProps = DiffEditorProps & {
    onOriginalChange?: (value: string) => void
    onModifiedChange?: (value: string) => void
}

export function MonacoDiffEditor(props: MonacoDiffEditorProps) {
    const { t } = useLang()
    const { className, onMount, ...diffProps } = props
    const { resolvedTheme } = useThemePreference()
    const monacoTheme = props.theme || getByteflowMonacoThemeName(resolvedTheme)

    const isMobile = useMobileEditorFallback()
    const [desktopActivation, activateDesktopMonaco] = useDesktopMonacoActivation(!isMobile)
    const shouldLoadMonaco = !isMobile && desktopActivation !== "deferred"
    const loaderState = useMonacoLoaderState(shouldLoadMonaco)
    const { hostRef, resolvedHeight } = useResolvedMonacoHeight(props.height, shouldLoadMonaco && loaderState !== "loading")
    const [originalValue, setOriginalValue] = React.useState(props.original ?? "")
    const [modifiedValue, setModifiedValue] = React.useState(props.modified ?? "")

    React.useEffect(() => {
        setOriginalValue(props.original ?? "")
    }, [props.original])

    React.useEffect(() => {
        setModifiedValue(props.modified ?? "")
    }, [props.modified])

    const diffOptions = React.useMemo(
        () => ({
            ...props.options,
            ariaLabel: props.options?.ariaLabel || t.common.text_diff_editor,
            originalAriaLabel: props.options?.originalAriaLabel || t.common.original_text_editor,
            modifiedAriaLabel: props.options?.modifiedAriaLabel || t.common.modified_text_editor,
            editContext: props.options?.editContext ?? false,
        }),
        [props.options, t.common.modified_text_editor, t.common.original_text_editor, t.common.text_diff_editor],
    )

    if (!isMobile && desktopActivation !== "deferred" && loaderState !== "fallback") {
        if (loaderState === "loading") return <EditorLoadingFallback />
        return (
            <div ref={hostRef} className={cn("h-full w-full", className)}>
                <DynamicMonacoDiffEditor
                    {...diffProps}
                    theme={monacoTheme}
                    options={diffOptions}
                    height={resolvedHeight}
                    onMount={(editor, monaco) => {
                        const originalLabel = diffOptions.originalAriaLabel || t.common.original_text_editor
                        const modifiedLabel = diffOptions.modifiedAriaLabel || t.common.modified_text_editor
                        editor.getOriginalEditor().updateOptions({ ariaLabel: originalLabel })
                        editor.getModifiedEditor().updateOptions({ ariaLabel: modifiedLabel })
                        onMount?.(editor, monaco)
                    }}
                />
            </div>
        )
    }

    const readOnly = Boolean(props.options?.readOnly)
    const originalEditable = props.options?.originalEditable ?? !readOnly

    return (
        <div className={cn("grid h-full min-h-[360px] grid-cols-1 gap-2 p-2 md:grid-cols-2", className)}>
            <textarea
                value={originalValue}
                readOnly={!originalEditable}
                spellCheck={false}
                aria-label={diffOptions.originalAriaLabel || t.common.original_text_editor}
                onFocus={activateDesktopMonaco}
                onPointerDown={activateDesktopMonaco}
                onChange={(event) => {
                    const nextValue = event.target.value
                    setOriginalValue(nextValue)
                    props.onOriginalChange?.(nextValue)
                }}
                className={cn(
                    "h-full min-h-[180px] w-full resize-none rounded border bg-background p-3 font-mono text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
                    !originalEditable ? "cursor-default text-muted-foreground" : "",
                )}
            />
            <textarea
                value={modifiedValue}
                readOnly={readOnly}
                spellCheck={false}
                aria-label={diffOptions.modifiedAriaLabel || t.common.modified_text_editor}
                onFocus={activateDesktopMonaco}
                onPointerDown={activateDesktopMonaco}
                onChange={(event) => {
                    const nextValue = event.target.value
                    setModifiedValue(nextValue)
                    props.onModifiedChange?.(nextValue)
                }}
                className={cn(
                    "h-full min-h-[180px] w-full resize-none rounded border bg-background p-3 font-mono text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
                    readOnly ? "cursor-default text-muted-foreground" : "",
                )}
            />
        </div>
    )
}
