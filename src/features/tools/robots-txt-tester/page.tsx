"use client"

import * as React from "react"
import { Bot, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { RelatedTools } from "@/core/seo/components/related-tools"
import { NO_MATCH_RULE, parseRobotsTxt, testRobotsUrl } from "@/features/tools/robots-txt-tester/utils"
import { ToolPageContainer } from "@/components/layout/page-container"

let nextTestId = 0
const PRIMARY_CRAWLER = "crawler-01"
const SECONDARY_CRAWLER = "crawler-02"

interface TestCase {
    id: string
    userAgent: string
    path: string
}

export function RobotsTxtTesterPage() {
    const { t } = useLang()
    const toolT = t.tools["robots_txt_tester"] as Record<string, string>
    const sampleRobots = `# ${toolT.sample_comment_default}
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/
Disallow: /api/
Crawl-delay: 1

# ${toolT.sample_comment_googlebot}
User-agent: ${PRIMARY_CRAWLER}
Allow: /api/public/
Disallow: /api/
Disallow: /tmp/

Sitemap: https://example.com/sitemap.xml`

    const [robotsTxt, setRobotsTxt] = React.useState(() => sampleRobots)
    const [tests, setTests] = React.useState<TestCase[]>([
        { id: `t_${nextTestId++}`, userAgent: PRIMARY_CRAWLER, path: "/api/public/docs" },
        { id: `t_${nextTestId++}`, userAgent: PRIMARY_CRAWLER, path: "/api/internal" },
        { id: `t_${nextTestId++}`, userAgent: SECONDARY_CRAWLER, path: "/admin/dashboard" },
        { id: `t_${nextTestId++}`, userAgent: SECONDARY_CRAWLER, path: "/about" },
    ])

    const rules = React.useMemo(() => parseRobotsTxt(robotsTxt), [robotsTxt])
    const results = React.useMemo(
        () =>
            tests.map((test) => ({
                ...test,
                ...testRobotsUrl(rules, test.userAgent, test.path),
            })),
        [rules, tests],
    )

    const addTest = () => {
        setTests((prev) => [...prev, { id: `t_${nextTestId++}`, userAgent: PRIMARY_CRAWLER, path: "/" }])
    }

    const removeTest = (id: string) => {
        setTests((prev) => prev.filter((test) => test.id !== id))
    }

    const updateTest = (id: string, field: "userAgent" | "path", value: string) => {
        setTests((prev) => prev.map((test) => (test.id === id ? { ...test, [field]: value } : test)))
    }

    return (
        <ToolPageContainer className="flex flex-col h-full space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Bot className="h-6 w-6 text-primary" />
                        {toolT.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {toolT.description}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                        <div className="tool-pane-header tool-pane-header-between">
                            <span>robots.txt</span>
                            <span className="text-xs text-muted-foreground">{toolT.rule_groups_parsed.replace("{count}", String(rules.length))}</span>
                        </div>
                        <Textarea
                            className="min-h-[400px] resize-none border-0 focus-visible:ring-1 focus-visible:ring-ring/50 font-mono text-sm leading-6 p-4"
                            value={robotsTxt}
                            onChange={(event) => setRobotsTxt(event.target.value)}
                            spellCheck={false}
                        />
                    </div>

                    {rules.length > 0 && (
                        <div className="p-4 border rounded-lg bg-card shadow-sm space-y-3">
                            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{toolT.parsed_rules}</h3>
                            {rules.map((rule, index) => (
                                <div key={index} className="text-xs space-y-1 pb-2 border-b border-border/30 last:border-0">
                                    <div className="font-semibold text-foreground">User-agent: {rule.userAgent}</div>
                                    {rule.allows.map((allow, allowIndex) => (
                                        <div key={`a${allowIndex}`} className="text-emerald-500 pl-3">Allow: {allow}</div>
                                    ))}
                                    {rule.disallows.map((disallow, disallowIndex) => (
                                        <div key={`d${disallowIndex}`} className="text-red-500 pl-3">Disallow: {disallow}</div>
                                    ))}
                                    {rule.crawlDelay !== undefined ? (
                                        <div className="text-muted-foreground pl-3">Crawl-delay: {rule.crawlDelay}</div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{toolT.test_urls}</h3>
                        <Button variant="outline" size="sm" onClick={addTest}>
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            {toolT.add_test}
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {results.map((result) => (
                            <div
                                key={result.id}
                                className={`p-4 border rounded-lg bg-card shadow-sm space-y-3 ${result.allowed ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-red-500"}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Input
                                        className="flex-1 font-mono text-xs"
                                        placeholder={PRIMARY_CRAWLER}
                                        value={result.userAgent}
                                        onChange={(event) => updateTest(result.id, "userAgent", event.target.value)}
                                    />
                                    <Input
                                        className="flex-1 font-mono text-xs"
                                        placeholder="/path"
                                        value={result.path}
                                        onChange={(event) => updateTest(result.id, "path", event.target.value)}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0"
                                        onClick={() => removeTest(result.id)}
                                        aria-label={toolT.remove_test_row}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">{toolT.remove_test_row}</span>
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    {result.allowed ? (
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className={`font-medium ${result.allowed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                        {result.allowed ? toolT.allowed : toolT.blocked}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {" - "}
                                        {result.matchedRule === NO_MATCH_RULE ? toolT.no_matching_rule_default_allowed : result.matchedRule}
                                        {" ("}
                                        {toolT.agent_label}
                                        {": "}
                                        {result.matchedAgent}
                                        {")"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <RelatedTools toolKey="robots_txt_tester" />
        </ToolPageContainer>
    )
}
