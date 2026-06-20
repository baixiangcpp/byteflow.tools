import { FileText } from "lucide-react"
import { describeFilePolicy, type FileInputPolicy } from "@/core/files/file-input-policy"

export function FilePolicyHint({ policy }: { policy: FileInputPolicy }) {
    return (
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{describeFilePolicy(policy)}</span>
        </p>
    )
}
