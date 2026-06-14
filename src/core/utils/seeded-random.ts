export type RandomFn = () => number

function xmur3(input: string) {
    let hash = 1779033703 ^ input.length
    for (let i = 0; i < input.length; i += 1) {
        hash = Math.imul(hash ^ input.charCodeAt(i), 3432918353)
        hash = (hash << 13) | (hash >>> 19)
    }
    return function nextHash() {
        hash = Math.imul(hash ^ (hash >>> 16), 2246822507)
        hash = Math.imul(hash ^ (hash >>> 13), 3266489909)
        hash ^= hash >>> 16
        return hash >>> 0
    }
}

function mulberry32(seed: number): RandomFn {
    let value = seed >>> 0
    return () => {
        value += 0x6d2b79f5
        let t = value
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function createSeededRandom(seed: string): RandomFn {
    const hash = xmur3(seed)()
    return mulberry32(hash)
}

export function createOptionalSeededRandom(seed?: string): RandomFn {
    if (!seed?.trim()) return Math.random
    return createSeededRandom(seed.trim())
}

export function randomInt(rng: RandomFn, minInclusive: number, maxInclusive: number): number {
    const low = Math.ceil(minInclusive)
    const high = Math.floor(maxInclusive)
    if (high <= low) return low
    return Math.floor(rng() * (high - low + 1)) + low
}
