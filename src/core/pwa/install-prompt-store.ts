"use client"

import { useSyncExternalStore } from "react"

export const PWA_INSTALL_INSTALLED_KEY = "byteflow:pwa-install:installed"
export const PWA_INSTALL_SESSION_PROMPTED_KEY = "byteflow:pwa-install:session-prompted"
export const PWA_INSTALL_PROMPT_SLOT = "__byteflowPwaInstallPrompt"
export const PWA_INSTALL_PROMPT_CHANGE_EVENT = "byteflow:pwa-install-prompt-change"
export const PWA_INSTALL_PROMPT_BRIDGE_READY_SLOT = "__byteflowPwaInstallPromptBridgeReady"

export type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{
        outcome: "accepted" | "dismissed"
        platform: string
    }>
}

type PwaInstallPromptWindow = Window & {
    [PWA_INSTALL_PROMPT_SLOT]?: BeforeInstallPromptEvent | null
}

function readWindowPrompt(): BeforeInstallPromptEvent | null {
    if (typeof window === "undefined") return null
    return (window as PwaInstallPromptWindow)[PWA_INSTALL_PROMPT_SLOT] ?? null
}

function writeWindowPrompt(prompt: BeforeInstallPromptEvent | null): void {
    if (typeof window === "undefined") return
    const promptWindow = window as PwaInstallPromptWindow
    promptWindow[PWA_INSTALL_PROMPT_SLOT] = prompt
}

let capturedInstallPrompt: BeforeInstallPromptEvent | null = readWindowPrompt()
const listeners = new Set<() => void>()
let bridgeListenerAttached = false

function emitChange(): void {
    for (const listener of listeners) listener()
}

function syncPromptFromBootstrap(): void {
    const nextPrompt = readWindowPrompt()
    if (capturedInstallPrompt === nextPrompt) return
    capturedInstallPrompt = nextPrompt
    emitChange()
}

function attachBootstrapBridge(): void {
    if (bridgeListenerAttached || typeof window === "undefined") return
    window.addEventListener(PWA_INSTALL_PROMPT_CHANGE_EVENT, syncPromptFromBootstrap)
    bridgeListenerAttached = true
}

function detachBootstrapBridge(): void {
    if (!bridgeListenerAttached || typeof window === "undefined" || listeners.size > 0) return
    window.removeEventListener(PWA_INSTALL_PROMPT_CHANGE_EVENT, syncPromptFromBootstrap)
    bridgeListenerAttached = false
}

export function capturePwaInstallPrompt(event: Event): BeforeInstallPromptEvent {
    event.preventDefault()
    try {
        window.localStorage.removeItem(PWA_INSTALL_INSTALLED_KEY)
    } catch {
        // The in-memory prompt remains usable when storage is denied.
    }

    capturedInstallPrompt = event as BeforeInstallPromptEvent
    writeWindowPrompt(capturedInstallPrompt)
    emitChange()
    return capturedInstallPrompt
}

export function consumePwaInstallPrompt(expectedPrompt?: BeforeInstallPromptEvent | null): boolean {
    capturedInstallPrompt = getPwaInstallPromptSnapshot()
    if (expectedPrompt !== undefined && capturedInstallPrompt !== expectedPrompt) return false
    if (!capturedInstallPrompt) return false

    capturedInstallPrompt = null
    writeWindowPrompt(null)
    emitChange()
    return true
}

export function getPwaInstallPromptSnapshot(): BeforeInstallPromptEvent | null {
    const windowPrompt = readWindowPrompt()
    if (capturedInstallPrompt !== windowPrompt) {
        capturedInstallPrompt = windowPrompt
    }
    return capturedInstallPrompt
}

export function subscribePwaInstallPrompt(listener: () => void): () => void {
    listeners.add(listener)
    attachBootstrapBridge()
    syncPromptFromBootstrap()
    return () => {
        listeners.delete(listener)
        detachBootstrapBridge()
    }
}

export function usePwaInstallPrompt(): BeforeInstallPromptEvent | null {
    return useSyncExternalStore(
        subscribePwaInstallPrompt,
        getPwaInstallPromptSnapshot,
        () => null,
    )
}
