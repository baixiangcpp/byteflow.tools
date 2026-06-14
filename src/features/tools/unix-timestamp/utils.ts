export function parseTimestampHeuristic(input: string): { date: Date; isMilliseconds: boolean } {
    const num = Number(input)
    if (isNaN(num)) return { date: new Date(NaN), isMilliseconds: false }

    // Smarter heuristic:
    // If num > 30,000,000,000 (30 billion), treat as milliseconds.
    // 30 billion seconds is year 2920.
    // 30 billion milliseconds is year 1971.
    // This correctly handles the most common use cases for both seconds and ms.
    const isMilliseconds = num > 30000000000
    const date = new Date(isMilliseconds ? num : num * 1000)
    
    return { date, isMilliseconds }
}
