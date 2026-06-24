import { describe, expect, it } from "vitest"
import { LOCALES } from "@/core/i18n/i18n"
import { MENU_GROUP_DEFS } from "@/core/registry/menu-groups"
import { getToolByKey } from "@/core/registry"
import { getWorkflowBySlug } from "@/core/workflows/workflow-hubs"
import {
    LOCALIZED_SEO_STRATEGY,
    TOPIC_CLUSTER_ROADMAP,
    TOPIC_CLUSTER_UI_COPY,
    TOPIC_CLUSTERS,
    type TopicClusterId,
} from "@/core/growth/topic-clusters"

const REQUIRED_CLUSTER_IDS: TopicClusterId[] = [
    "json-structured-data",
    "api-http-openapi",
    "jwt-auth-crypto-certificates",
    "logs-devops-incident-handoff",
    "text-regex-unicode",
    "images-svg-css",
    "generators-ids-test-data",
    "social-metadata-content-ops",
]

describe("BF-042/BF-043 topic cluster and localized SEO strategy", () => {
    it("defines eight crawlable pillar clusters with tools, workflows, and supporting articles", () => {
        expect(TOPIC_CLUSTERS.map((cluster) => cluster.id)).toEqual(REQUIRED_CLUSTER_IDS)

        const menuGroups = new Map(MENU_GROUP_DEFS.map((group) => [group.key, group.slug]))
        for (const cluster of TOPIC_CLUSTERS) {
            expect(menuGroups.get(cluster.pillarGroupKey), cluster.id).toBe(cluster.pillarSlug)
            expect(cluster.intent.trim(), cluster.id).not.toBe("")
            expect(cluster.primaryToolKeys.length, cluster.id).toBeGreaterThanOrEqual(5)
            expect(cluster.supportingArticleSlugs.length, cluster.id).toBeGreaterThanOrEqual(3)
            expect(cluster.workflowSlugs.length, cluster.id).toBeGreaterThanOrEqual(1)
            expect(cluster.adjacentClusterIds.length, cluster.id).toBeGreaterThanOrEqual(2)

            for (const toolKey of cluster.primaryToolKeys) {
                expect(getToolByKey(toolKey), `${cluster.id}:${toolKey}`).toBeTruthy()
            }
            for (const workflowSlug of cluster.workflowSlugs) {
                expect(getWorkflowBySlug(workflowSlug), `${cluster.id}:${workflowSlug}`).toBeTruthy()
            }
            for (const adjacent of cluster.adjacentClusterIds) {
                expect(REQUIRED_CLUSTER_IDS).toContain(adjacent)
                expect(adjacent).not.toBe(cluster.id)
            }
        }
    })

    it("defines localized topic-cluster UI copy for every supported locale", () => {
        for (const locale of LOCALES) {
            const copy = TOPIC_CLUSTER_UI_COPY[locale]
            expect(copy.eyebrow.trim(), locale).not.toBe("")
            expect(copy.supportingGuides.trim(), locale).not.toBe("")
            if (locale !== "en") {
                expect(copy.eyebrow, locale).not.toBe(TOPIC_CLUSTER_UI_COPY.en.eyebrow)
                expect(copy.supportingGuides, locale).not.toBe(TOPIC_CLUSTER_UI_COPY.en.supportingGuides)
            }
        }
    })

    it("maps every non-English locale to cluster-specific keyword plans and copy requirements", () => {
        expect(LOCALIZED_SEO_STRATEGY.map((entry) => entry.locale)).toEqual([
            "zh-CN",
            "zh-TW",
            "ja",
            "ko",
            "de",
            "fr",
        ])

        for (const strategy of LOCALIZED_SEO_STRATEGY) {
            expect(strategy.searchBehavior.trim(), strategy.locale).not.toBe("")
            expect(strategy.copyRequirements.length, strategy.locale).toBeGreaterThanOrEqual(3)

            for (const clusterId of REQUIRED_CLUSTER_IDS) {
                const keywords = strategy.keywordMap[clusterId]
                expect(keywords.length, `${strategy.locale}:${clusterId}`).toBeGreaterThanOrEqual(3)
                expect(keywords.every((keyword) => keyword.trim().length > 0), `${strategy.locale}:${clusterId}`).toBe(true)
            }
        }
    })

    it("documents a 30/60/90 day roadmap for expanding the clusters", () => {
        expect(TOPIC_CLUSTER_ROADMAP.map((item) => item.window)).toEqual(["30 days", "60 days", "90 days"])
        for (const item of TOPIC_CLUSTER_ROADMAP) {
            expect(item.focus).toContain("cluster")
        }
    })
})
