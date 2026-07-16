"use client"

import * as React from "react"
import { useDialogReturnFocus } from "@/hooks/use-dialog-return-focus"
import type { JsonPath, TreeDialogState } from "./types"

type JsonTreeFocusAction = "add-child" | "edit-node" | "rename-key"

function findJsonTreeFocusTarget(path: JsonPath, action: JsonTreeFocusAction): HTMLElement | null {
    const serializedPath = JSON.stringify(path)
    return Array.from(document.querySelectorAll<HTMLElement>(`[data-json-tree-action="${action}"]`))
        .find((element) => element.dataset.jsonTreePath === serializedPath)
        ?? null
}

export function useJsonTreeDialog() {
    const [treeDialog, setTreeDialog] = React.useState<TreeDialogState>(null)
    const { captureReturnFocus, restoreReturnFocus, setReturnFocusFallback } = useDialogReturnFocus()

    const openTreeDialog = React.useCallback((dialog: NonNullable<TreeDialogState>) => {
        captureReturnFocus()
        setTreeDialog(dialog)
    }, [captureReturnFocus])

    const closeTreeDialog = React.useCallback(() => {
        setTreeDialog(null)
    }, [])

    const updateTreeDialogDraft = React.useCallback((draft: string) => {
        setTreeDialog((current) => current ? { ...current, draft } : current)
    }, [])

    const prepareRenameReturnFocus = React.useCallback((parentPath: JsonPath, nextKey: string) => {
        const renamedPath = [...parentPath, nextKey]
        setReturnFocusFallback(() => (
            findJsonTreeFocusTarget(renamedPath, "rename-key")
            ?? findJsonTreeFocusTarget(renamedPath, "edit-node")
            ?? findJsonTreeFocusTarget(parentPath, "add-child")
            ?? findJsonTreeFocusTarget(parentPath, "edit-node")
        ))
    }, [setReturnFocusFallback])

    return {
        closeTreeDialog,
        openTreeDialog,
        prepareRenameReturnFocus,
        restoreTreeDialogReturnFocus: restoreReturnFocus,
        treeDialog,
        updateTreeDialogDraft,
    }
}
