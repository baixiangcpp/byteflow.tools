"use client"

import * as React from "react"
import { Regex, Eraser } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function RegexTesterPage() {
    const { t } = useLang()
    const toolT = t.tools["regex_tester"] as Record<string, string>
    const [pattern, setPattern] = React.useState("[A-Z][a-z]+")
    const [flags, setFlags] = React.useState("g")
    const [testString, setTestString] = React.useState("Ab1 Cd2 Ef3 Gh4.")
    const [matches, setMatches] = React.useState<{ match: string; index: number; groupIndex: number; groups: unknown[] }[]>([])
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!pattern) {
            setMatches([])
            setError(null)
            return
        }

        try {
            // Create RegExp intelligently. If 'g' is not present, matchAll throws an error.
            // We will handle single matches or global matches gracefully.
            const isGlobal = flags.includes("g")
            const safeFlags = isGlobal ? flags : `${flags}g` // For matchAll to work, 'g' must be present, but we will limit results if not global

            const regex = new RegExp(pattern, safeFlags)

            const results = []
            let matchCount = 0

            // Edge case for empty strings to prevent infinite loops if regex matches empty
            if (testString === "") {
                setMatches([])
                setError(null)
                return
            }

            for (const match of testString.matchAll(regex)) {
                if (!isGlobal && matchCount > 0) break // stop if not global

                results.push({
                    match: match[0],
                    index: match.index ?? 0,
                    groupIndex: matchCount,
                    groups: match.slice(1) // capture groups
                })

                matchCount++

                // Safety limit to prevent infinite loops/browser freezing on bad regex like `.*` repeatedly matching `""`
                if (matchCount > 5000) {
                    setError(toolT.error_match_limit)
                    break
                }
                if (match[0].length === 0) {
                    // if it matches an empty string, force advance lastIndex to prevent infinite loop
                    regex.lastIndex++
                }
            }

            setMatches(results)
            setError(null)

        } catch (e: unknown) {
            void e
            setError(toolT.error_invalid_regex)
            setMatches([])
        }
    }, [flags, pattern, testString, toolT.error_invalid_regex, toolT.error_match_limit])

    const handleClear = () => {
        setPattern("")
        setFlags("g")
        setTestString("")
    }

    return (
        <div className="flex flex-col h-full space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Regex className="h-6 w-6 text-primary" />
                        {t.tools['regex_tester'].title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t.tools['regex_tester'].description}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleClear}>
                        <Eraser className="mr-2 h-4 w-4" />
                        {toolT.clear_all_action}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">

                {/* Input Controls */}
                <div className="md:col-span-12 space-y-4 p-6 border rounded-xl bg-card shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-2 relative">
                            <label className="text-sm font-medium leading-none">
                                {toolT.expression_pattern_label}
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3 text-muted-foreground font-mono text-lg select-none">/</div>
                                <Input
                                    type="text"
                                    className={`font-mono text-lg h-12 pl-8 pr-4 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                    placeholder={toolT.pattern_placeholder}
                                    value={pattern}
                                    onChange={(e) => setPattern(e.target.value)}
                                    spellCheck={false}
                                />
                                <div className="absolute right-3 text-muted-foreground font-mono text-lg select-none">/</div>
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>

                        <div className="w-full md:w-32 space-y-2">
                            <label className="text-sm font-medium leading-none">
                                {toolT.flags_label}
                            </label>
                            <Input
                                type="text"
                                className="font-mono text-lg h-12"
                                placeholder={toolT.flags_placeholder}
                                value={flags}
                                onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))} // Restrict to valid JS regex flags
                                maxLength={6}
                            />
                        </div>
                    </div>
                </div>

                {/* Test String */}
                <div className="md:col-span-8 flex flex-col border rounded-xl bg-card shadow-sm overflow-hidden">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.test_string_label}</span>
                    </div>
                    <Textarea
                        className="flex-1 min-h-[350px] resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 p-4 font-mono text-base leading-relaxed"
                        placeholder={toolT.test_string_placeholder}
                        value={testString}
                        onChange={(e) => setTestString(e.target.value)}
                        spellCheck={false}
                    />
                </div>

                {/* Results Pane */}
                <div className="md:col-span-4 flex flex-col border rounded-xl bg-card shadow-sm overflow-hidden min-h-[350px]">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.match_results_label}</span>
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {matches.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {matches.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                                <p className="text-sm">{error ? toolT.empty_state_error : toolT.empty_state_no_match}</p>
                            </div>
                        ) : (
                            matches.map((m, i) => (
                                <div key={i} className="border rounded-md overflow-hidden bg-background">
                                    <div className="bg-muted px-3 py-1 border-b text-xs font-semibold text-muted-foreground flex justify-between">
                                        <span>{toolT.match_prefix} {i + 1}</span>
                                        <span className="font-mono">{toolT.index_prefix} {m.index}</span>
                                    </div>
                                    <div className="p-3">
                                        <span className="font-mono text-sm bg-primary/20 text-primary px-1.5 py-0.5 rounded break-all">
                                            {m.match}
                                        </span>
                                    </div>
                                    {m.groups.length > 0 && m.groups.some(g => g !== undefined) && (
                                        <div className="px-3 pb-3 space-y-1">
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-t pt-2 mb-1">{toolT.capture_groups_label}</div>
                                            {m.groups.map((g, gi) => (
                                                g !== undefined && (
                                                    <div key={gi} className="flex items-center gap-2 text-xs font-mono">
                                                        <span className="text-muted-foreground">{toolT.group_prefix} {gi + 1}:</span>
                                                        <span className="text-foreground bg-muted px-1 rounded">{String(g)}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
