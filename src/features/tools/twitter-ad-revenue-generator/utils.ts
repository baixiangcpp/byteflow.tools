import { serializeSpreadsheetSafeCsv } from "@/core/files/csv-export"

export type TwitterRevenueInput = {
    impressionsPerDay: number
    cpmUsd: number
    ctrPercent: number
    cpcUsd: number
    fillRatePercent: number
    growthPercentPerDay: number
    days: number
}

export type TwitterRevenuePoint = {
    day: number
    impressions: number
    estimatedClicks: number
    displayAdRevenueUsd: number
    clickRevenueUsd: number
    totalRevenueUsd: number
}

export type TwitterRevenueSummary = {
    totalImpressions: number
    totalRevenueUsd: number
    averageDailyRevenueUsd: number
    estimatedClicks: number
    eRPMUsd: number
}

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
}

export function normalizeTwitterRevenueInput(input: TwitterRevenueInput): TwitterRevenueInput {
    return {
        impressionsPerDay: Math.round(clamp(input.impressionsPerDay, 100, 100_000_000)),
        cpmUsd: clamp(input.cpmUsd, 0, 200),
        ctrPercent: clamp(input.ctrPercent, 0, 100),
        cpcUsd: clamp(input.cpcUsd, 0, 100),
        fillRatePercent: clamp(input.fillRatePercent, 0, 100),
        growthPercentPerDay: clamp(input.growthPercentPerDay, -50, 100),
        days: Math.round(clamp(input.days, 1, 365)),
    }
}

export function buildTwitterRevenueSeries(input: TwitterRevenueInput): TwitterRevenuePoint[] {
    const safe = normalizeTwitterRevenueInput(input)
    const series: TwitterRevenuePoint[] = []

    for (let day = 1; day <= safe.days; day += 1) {
        const growthFactor = Math.pow(1 + safe.growthPercentPerDay / 100, day - 1)
        const impressions = Math.round(safe.impressionsPerDay * growthFactor)
        const displayAdRevenueUsd = (impressions / 1000) * safe.cpmUsd * (safe.fillRatePercent / 100)
        const estimatedClicks = Math.round(impressions * (safe.ctrPercent / 100))
        const clickRevenueUsd = estimatedClicks * safe.cpcUsd
        const totalRevenueUsd = displayAdRevenueUsd + clickRevenueUsd

        series.push({
            day,
            impressions,
            estimatedClicks,
            displayAdRevenueUsd,
            clickRevenueUsd,
            totalRevenueUsd,
        })
    }

    return series
}

export function summarizeTwitterRevenue(series: TwitterRevenuePoint[]): TwitterRevenueSummary {
    if (series.length === 0) {
        return {
            totalImpressions: 0,
            totalRevenueUsd: 0,
            averageDailyRevenueUsd: 0,
            estimatedClicks: 0,
            eRPMUsd: 0,
        }
    }

    let totalImpressions = 0
    let totalRevenueUsd = 0
    let estimatedClicks = 0

    for (const point of series) {
        totalImpressions += point.impressions
        totalRevenueUsd += point.totalRevenueUsd
        estimatedClicks += point.estimatedClicks
    }

    return {
        totalImpressions,
        totalRevenueUsd,
        averageDailyRevenueUsd: totalRevenueUsd / series.length,
        estimatedClicks: Math.round(estimatedClicks),
        eRPMUsd: totalImpressions > 0 ? (totalRevenueUsd / totalImpressions) * 1000 : 0,
    }
}

export function seriesToCsv(series: TwitterRevenuePoint[]): string {
    return serializeSpreadsheetSafeCsv([
        ["day", "impressions", "display_ad_revenue_usd", "click_revenue_usd", "total_revenue_usd"],
        ...series.map((point) => [
            point.day,
            point.impressions,
            point.displayAdRevenueUsd.toFixed(2),
            point.clickRevenueUsd.toFixed(2),
            point.totalRevenueUsd.toFixed(2),
        ] as const),
    ])
}
