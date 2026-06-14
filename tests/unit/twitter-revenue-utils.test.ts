import { describe, expect, it } from "vitest"
import {
    buildTwitterRevenueSeries,
    normalizeTwitterRevenueInput,
    seriesToCsv,
    summarizeTwitterRevenue,
    type TwitterRevenueInput,
} from "@/features/tools/twitter-ad-revenue-generator/utils"

describe("twitter-revenue-utils", () => {
    const input: TwitterRevenueInput = {
        impressionsPerDay: 100_000,
        cpmUsd: 4.5,
        ctrPercent: 1.2,
        cpcUsd: 0.25,
        fillRatePercent: 80,
        growthPercentPerDay: 2,
        days: 7,
    }

    it("normalizes out-of-range values", () => {
        const safe = normalizeTwitterRevenueInput({
            ...input,
            impressionsPerDay: -1,
            cpmUsd: 999,
            days: 9999,
        })
        expect(safe.impressionsPerDay).toBe(100)
        expect(safe.cpmUsd).toBe(200)
        expect(safe.days).toBe(365)
    })

    it("builds a daily revenue series", () => {
        const series = buildTwitterRevenueSeries(input)
        expect(series).toHaveLength(7)
        expect(series[0].impressions).toBe(100000)
        expect(series[1].impressions).toBeGreaterThan(series[0].impressions)
        expect(series[0].totalRevenueUsd).toBeGreaterThan(0)
    })

    it("summarizes totals and eRPM", () => {
        const summary = summarizeTwitterRevenue(buildTwitterRevenueSeries(input))
        expect(summary.totalImpressions).toBeGreaterThan(0)
        expect(summary.totalRevenueUsd).toBeGreaterThan(0)
        expect(summary.eRPMUsd).toBeGreaterThan(0)
    })

    it("serializes series to csv", () => {
        const csv = seriesToCsv(buildTwitterRevenueSeries({ ...input, days: 2 }))
        const lines = csv.split("\n")
        expect(lines[0]).toContain("day,impressions")
        expect(lines).toHaveLength(3)
    })
})
