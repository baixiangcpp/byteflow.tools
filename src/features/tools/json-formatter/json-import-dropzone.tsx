import * as React from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TEXT_FILE_IMPORT_ACCEPT } from "@/core/files/text-file-import"

type JsonImportDropzoneProps = {
    fileInputRef: React.RefObject<HTMLInputElement | null>
    isDragActive: boolean
    onDragActiveChange: (isActive: boolean) => void
    onImportFile: (file: File) => void | Promise<void>
    onOpenImportPicker: () => void
    text: (key: string) => string
}

export function JsonImportDropzone({
    fileInputRef,
    isDragActive,
    onDragActiveChange,
    onImportFile,
    onOpenImportPicker,
    text,
}: JsonImportDropzoneProps) {
    return (
        <div
            className={`rounded-xl border border-dashed px-4 py-3 transition-colors ${isDragActive ? "border-primary bg-primary/10" : "border-border/70 bg-card/40"}`}
            onDragOver={(event) => {
                event.preventDefault()
                onDragActiveChange(true)
            }}
            onDragLeave={(event) => {
                event.preventDefault()
                onDragActiveChange(false)
            }}
            onDrop={(event) => {
                event.preventDefault()
                onDragActiveChange(false)
                const file = event.dataTransfer.files?.[0]
                if (!file) return
                void onImportFile(file)
            }}
        >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    {text("drag_drop_import_hint")}
                </p>
                <Button variant="outline" size="sm" onClick={onOpenImportPicker}>
                    <Upload className="mr-2 h-4 w-4" />
                    {text("import_file")}
                </Button>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept={TEXT_FILE_IMPORT_ACCEPT}
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.currentTarget.value = ""
                    if (!file) return
                    void onImportFile(file)
                }}
            />
        </div>
    )
}
