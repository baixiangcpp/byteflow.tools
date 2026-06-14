import { createOptionalSeededRandom, randomInt, type RandomFn } from "@/core/utils/seeded-random"

export type RandomizeMode = "shuffle" | "sample"

export function parseRandomizerItems(input: string, dedupe: boolean): string[] {
    const raw = input
        .split(/\r?\n/g)
        .map((item) => item.trim())
        .filter(Boolean)

    if (!dedupe) return raw

    const seen = new Set<string>()
    const unique: string[] = []
    for (const item of raw) {
        if (seen.has(item)) continue
        seen.add(item)
        unique.push(item)
    }
    return unique
}

export function shuffleItems(items: string[], rng: RandomFn): string[] {
    const list = [...items]
    for (let i = list.length - 1; i > 0; i -= 1) {
        const j = randomInt(rng, 0, i)
        const temp = list[i]
        list[i] = list[j]
        list[j] = temp
    }
    return list
}

export function sampleItems(items: string[], count: number, withReplacement: boolean, rng: RandomFn): string[] {
    if (count <= 0 || items.length === 0) return []

    if (withReplacement) {
        const picked: string[] = []
        for (let i = 0; i < count; i += 1) {
            const index = randomInt(rng, 0, items.length - 1)
            picked.push(items[index])
        }
        return picked
    }

    return shuffleItems(items, rng).slice(0, Math.min(count, items.length))
}

export function randomizeList(options: {
    input: string
    mode: RandomizeMode
    dedupe: boolean
    sampleCount: number
    withReplacement: boolean
    seed?: string
}): { items: string[]; sourceCount: number } {
    const base = parseRandomizerItems(options.input, options.dedupe)
    const rng = createOptionalSeededRandom(options.seed)

    if (options.mode === "shuffle") {
        return {
            items: shuffleItems(base, rng),
            sourceCount: base.length,
        }
    }

    return {
        items: sampleItems(base, options.sampleCount, options.withReplacement, rng),
        sourceCount: base.length,
    }
}
