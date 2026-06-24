"use client"

import * as React from "react"
import { Regex, Eraser, TestTube2, Clock3, AlertTriangle } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolActionBar, type ToolAction } from "@/features/tool-shell/tool-action-bar"
import { runRegexTestTask } from "./regex-test-task"
import { type RegexMatchSummary } from "./utils"

const SAMPLE_PATTERN = "[A-Z][a-z]+"
const SAMPLE_FLAGS = "g"
const SAMPLE_TEST_STRING = "Ab1 Cd2 Ef3 Gh4."

export function RegexTesterPage() {
    const { t } = useLang()
    const toolT = t.tools["regex_tester"] as Record<string, string>
    const [pattern, setPattern] = React.useState(SAMPLE_PATTERN)
    const [flags, setFlags] = React.useState(SAMPLE_FLAGS)
    const [testString, setTestString] = React.useState(SAMPLE_TEST_STRING)
    const [matches, setMatches] = React.useState<RegexMatchSummary[]>([])
    const [error, setError] = React.useState<string | null>(null)
    const [warnings, setWarnings] = React.useState<string[]>([])
    const [elapsedMs, setElapsedMs] = React.useState(0)
    const [isEvaluating, setIsEvaluating] = React.useState(false)
    const evaluationAbortControllerRef = React.useRef<AbortController | null>(null)

    React.useEffect(() => {
        evaluationAbortControllerRef.current?.abort()

        if (!pattern) {
            setMatches([])
            setError(null)
            setWarnings([])
            setElapsedMs(0)
            setIsEvaluating(false)
            return
        }

        const controller = new AbortController()
        evaluationAbortControllerRef.current = controller
        setIsEvaluating(true)

        void runRegexTestTask(pattern, flags, testString, {
            signal: controller.signal,
            timeoutMs: 1_000,
        })
            .then((result) => {
                if (controller.signal.aborted) return
                setElapsedMs(result.elapsedMs)
                setWarnings(result.warnings)
                if (result.ok) {
                    setMatches(result.matches)
                    setError(result.limited ? toolT.error_match_limit : null)
                } else {
                    setError(result.error || toolT.error_invalid_regex)
                    setMatches([])
                }
            })
            .catch((taskError) => {
                if (controller.signal.aborted) return
                setMatches([])
                setWarnings([])
                setElapsedMs(0)
                setError(taskError instanceof Error ? taskError.message : toolT.error_invalid_regex)
            })
            .finally(() => {
                if (controller.signal.aborted) return
                setIsEvaluating(false)
                evaluationAbortControllerRef.current = null
            })

        return () => {
            controller.abort()
        }
    }, [flags, pattern, testString, toolT.error_invalid_regex, toolT.error_match_limit])

    const handleClear = () => {
        setPattern("")
        setFlags(SAMPLE_FLAGS)
        setTestString("")
        setMatches([])
        setError(null)
        setWarnings([])
        setElapsedMs(0)
        setIsEvaluating(false)
    }

    const handleSample = () => {
        setPattern(SAMPLE_PATTERN)
        setFlags(SAMPLE_FLAGS)
        setTestString(SAMPLE_TEST_STRING)
    }

    const actions: ToolAction[] = [
        {
            id: "sample",
            label: t.common.sample,
            icon: TestTube2,
            onClick: handleSample,
        },
        {
            id: "clear",
            label: t.common.clear,
            icon: Eraser,
            onClick: handleClear,
            destructive: true,
        },
    ]

    return (
        <div className="flex flex-col h-full space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Regex className="h-6 w-6 text-primary" />
                        {t.tools['regex_tester'].title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t.tools['regex_tester'].description}
                    </p>
                </div>
                <ToolActionBar actions={actions} />
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-6 pt-2 md:grid-cols-12">

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
                <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm md:col-span-8">
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
                <div className="flex min-h-[350px] min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm md:col-span-4">
                    <div className="tool-pane-header tool-pane-header-between">
                        <span>{toolT.match_results_label}</span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5" />
                            {isEvaluating ? toolT.evaluating_label : toolT.timing_label.replace("{ms}", elapsedMs.toFixed(1))}
                            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                {matches.length}
                            </span>
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {warnings.length > 0 && (
                            <div className="rounded-md border border-amber-500/35 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                                <div className="flex items-start gap-2 font-medium">
                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
                                    <span>{toolT.performance_warning_title}</span>
                                </div>
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                    {warnings.map((warning) => (
                                        <li key={warning}>{warning}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {matches.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                                <p className="text-sm">{isEvaluating ? toolT.evaluating_label : error ? toolT.empty_state_error : toolT.empty_state_no_match}</p>
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
