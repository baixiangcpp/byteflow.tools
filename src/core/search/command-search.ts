const DIACRITIC_RE = /[\u0300-\u036f]/g
const WORD_SPLIT_RE = /[\s/_+.#"@[\]({&:;|,<>?!=`~\\-]+/g

function normalizeSearchText(value: string): string {
    return value
        .normalize("NFKD")
        .replace(DIACRITIC_RE, "")
        .toLowerCase()
        .replace(WORD_SPLIT_RE, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function compactSearchText(value: string): string {
    return normalizeSearchText(value).replace(/\s+/g, "")
}

function tokenizeSearchText(value: string): string[] {
    return normalizeSearchText(value)
        .split(" ")
        .map((token) => token.trim())
        .filter(Boolean)
}

function editDistanceWithin(left: string, right: string, maxDistance: number): number {
    if (Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1

    const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
    const current = Array.from({ length: right.length + 1 }, () => 0)

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
        current[0] = leftIndex
        let rowMin = current[0]

        for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
            const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
            current[rightIndex] = Math.min(
                previous[rightIndex] + 1,
                current[rightIndex - 1] + 1,
                previous[rightIndex - 1] + substitutionCost,
            )
            rowMin = Math.min(rowMin, current[rightIndex])
        }

        if (rowMin > maxDistance) return maxDistance + 1
        previous.splice(0, previous.length, ...current)
    }

    return previous[right.length]
}

function fuzzyTokenScore(queryToken: string, candidateTokens: string[]): number {
    if (queryToken.length < 4) return 0
    const maxDistance = queryToken.length >= 8 ? 2 : 1

    for (const candidate of candidateTokens) {
        if (candidate.length < 4) continue
        if (candidate.includes(queryToken)) return 0.72

        const distance = editDistanceWithin(queryToken, candidate, maxDistance)
        if (distance <= maxDistance) {
            return distance === 1 ? 0.66 : 0.54
        }
    }

    return 0
}

function directFieldScore(field: string, normalizedQuery: string, compactQuery: string, scores: {
    exact: number
    prefix: number
    word: number
    compact: number
    contains: number
}): number {
    if (field === normalizedQuery) return scores.exact
    if (field.startsWith(normalizedQuery)) return scores.prefix
    if (field.includes(` ${normalizedQuery}`)) return scores.word
    if (compactSearchText(field).includes(compactQuery)) return scores.compact
    if (field.includes(normalizedQuery)) return scores.contains
    return 0
}

export function scoreCommandSearch(value: string, search: string, keywords: readonly string[] = []): number {
    const normalizedQuery = normalizeSearchText(search)
    if (!normalizedQuery) return 1

    const valueField = normalizeSearchText(value)
    const keywordFields = keywords
        .map((field) => normalizeSearchText(field))
        .filter(Boolean)
    const fields = [valueField, ...keywordFields].filter(Boolean)
    if (!valueField && keywordFields.length === 0) return 0

    const compactQuery = compactSearchText(normalizedQuery)
    const valueDirectScore = valueField
        ? directFieldScore(valueField, normalizedQuery, compactQuery, {
            exact: 100,
            prefix: 96,
            word: 88,
            compact: 82,
            contains: 76,
        })
        : 0
    const keywordDirectScore = Math.max(
        0,
        ...keywordFields.map((field, index) => directFieldScore(field, normalizedQuery, compactQuery, index === 0
            ? {
                exact: 98,
                prefix: 94,
                word: 86,
                compact: 82,
                contains: 76,
            }
            : {
                exact: 92,
                prefix: 86,
                word: 82,
                compact: 80,
                contains: 74,
            })),
    )
    const directScore = Math.max(valueDirectScore, keywordDirectScore)
    if (directScore > 0) return directScore

    const haystack = fields.join(" ")
    if (!haystack) return 0

    const queryTokens = tokenizeSearchText(normalizedQuery)
    const candidateTokens = tokenizeSearchText(haystack)
    if (queryTokens.length === 0 || candidateTokens.length === 0) return 0

    let total = 0
    for (const queryToken of queryTokens) {
        if (candidateTokens.includes(queryToken)) {
            total += 1
            continue
        }

        if (candidateTokens.some((candidate) => candidate.startsWith(queryToken))) {
            total += 0.84
            continue
        }

        const fuzzyScore = fuzzyTokenScore(queryToken, candidateTokens)
        if (fuzzyScore > 0) {
            total += fuzzyScore
            continue
        }

        return 0
    }

    const coverage = total / queryTokens.length
    if (coverage <= 0) return 0

    const orderBonus = haystack.indexOf(queryTokens[0]) <= 8 ? 8 : 0
    return 24 + coverage * 48 + orderBonus
}
