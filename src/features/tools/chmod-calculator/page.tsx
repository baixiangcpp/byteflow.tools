"use client"

import * as React from "react"
import { Copy, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { ToolPageContainer } from "@/components/layout/page-container"

export function ChmodCalculatorPage() {
    const { t } = useLang()
    const [perms, setPerms] = React.useState([
        [true, true, true],   // Owner:  rwx = 7
        [true, false, true],  // Group:  r-x = 5
        [true, false, true],  // Others: r-x = 5
    ])
    const [octalInput, setOctalInput] = React.useState("755")
    const toolT = t.tools["chmod_calculator"] as Record<string, string>
    const permLabels = React.useMemo(
        () => [toolT.perm_read, toolT.perm_write, toolT.perm_execute],
        [toolT],
    )
    const groupLabels = React.useMemo(
        () => [toolT.group_owner, toolT.group_group, toolT.group_others],
        [toolT],
    )

    const togglePerm = (group: number, perm: number) => {
        const next = perms.map(g => [...g])
        next[group][perm] = !next[group][perm]
        setPerms(next)
        setOctalInput(next.map(g => g.reduce((acc, v, i) => acc + (v ? [4, 2, 1][i] : 0), 0)).join(""))
    }

    const handleOctalChange = (val: string) => {
        setOctalInput(val)
        if (/^[0-7]{3}$/.test(val)) {
            const digits = val.split("").map(Number)
            setPerms(digits.map(d => [!!(d & 4), !!(d & 2), !!(d & 1)]))
        }
    }

    const octal = perms.map(g => g.reduce((acc, v, i) => acc + (v ? [4, 2, 1][i] : 0), 0)).join("")
    const symbolic = perms.map(g => [
        g[0] ? "r" : "-",
        g[1] ? "w" : "-",
        g[2] ? "x" : "-",
    ].join("")).join("")

    const command = `chmod ${octal} filename`

    const handleCopyCommand = async () => {
        const result = await safeClipboardWrite(command)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, { description: command })
    }

    return (
        <ToolPageContainer className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b px-4 py-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">{toolT.title}</h1>
                        <p className="text-xs text-muted-foreground">{toolT.description}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => void handleCopyCommand()}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> {toolT.copy_command}
                </Button>
            </div>

            <div className="flex-1 flex items-start justify-center p-6 overflow-auto">
                <div className="w-full max-w-lg space-y-6">
                    {/* Octal Input */}
                    <div className="text-center space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{toolT.octal_notation}</label>
                        <input
                            value={octalInput}
                            onChange={(e) => handleOctalChange(e.target.value)}
                            maxLength={3}
                            className="block mx-auto w-32 text-center text-4xl font-mono font-bold bg-transparent border-b-2 border-primary py-2 text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>

                    {/* Permission Matrix */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-muted/30">
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-muted-foreground"> </th>
                                    {permLabels.map((p) => (
                                        <th key={p} className="py-2 px-4 text-center text-xs font-semibold text-muted-foreground">{p}</th>
                                    ))}
                                    <th className="py-2 px-4 text-center text-xs font-semibold text-muted-foreground">{toolT.octal_col}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupLabels.map((group, gi) => (
                                    <tr key={group} className="border-t border-border">
                                        <td className="py-3 px-4 text-sm font-medium text-foreground">{group}</td>
                                        {permLabels.map((_, pi) => (
                                            <td key={pi} className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() => togglePerm(gi, pi)}
                                                    className={`h-9 w-9 rounded-md text-sm font-mono font-bold transition-[background-color,color,box-shadow] ${perms[gi][pi]
                                                        ? "bg-primary text-primary-foreground shadow-sm"
                                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                        }`}
                                                >
                                                    {perms[gi][pi] ? ["r", "w", "x"][pi] : "-"}
                                                </button>
                                            </td>
                                        ))}
                                        <td className="py-3 px-4 text-center">
                                            <span className="font-mono text-lg font-bold text-primary">{perms[gi].reduce((acc, v, i) => acc + (v ? [4, 2, 1][i] : 0), 0)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Results */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 rounded-lg p-4 text-center">
                            <div className="text-xs text-muted-foreground font-medium mb-1">{toolT.symbolic}</div>
                            <div className="font-mono text-xl font-bold text-foreground tracking-wider">{symbolic}</div>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 text-center">
                            <div className="text-xs text-muted-foreground font-medium mb-1">{toolT.command}</div>
                            <div className="font-mono text-sm font-bold text-primary">{command}</div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolPageContainer>
    )
}
