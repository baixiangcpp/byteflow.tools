import { describe, expect, it } from "vitest"
import { parseRandomizerItems, randomizeList } from "@/features/tools/list-randomizer/utils"

describe("list-randomizer-utils", () => {
    it("parses and deduplicates list items", () => {
        const input = "alpha\n beta \nalpha\n\ncharlie"
        expect(parseRandomizerItems(input, false)).toEqual(["alpha", "beta", "alpha", "charlie"])
        expect(parseRandomizerItems(input, true)).toEqual(["alpha", "beta", "charlie"])
    })

    it("produces deterministic shuffle with seed", () => {
        const input = "A\nB\nC\nD\nE"
        const first = randomizeList({
            input,
            mode: "shuffle",
            dedupe: false,
            sampleCount: 2,
            withReplacement: false,
            seed: "repeatable-seed",
        })
        const second = randomizeList({
            input,
            mode: "shuffle",
            dedupe: false,
            sampleCount: 2,
            withReplacement: false,
            seed: "repeatable-seed",
        })

        expect(first.items).toEqual(second.items)
        expect(first.sourceCount).toBe(5)
    })

    it("samples requested amount with replacement", () => {
        const result = randomizeList({
            input: "x\ny",
            mode: "sample",
            dedupe: false,
            sampleCount: 5,
            withReplacement: true,
            seed: "sample",
        })

        expect(result.items).toHaveLength(5)
        expect(result.items.every((item) => item === "x" || item === "y")).toBe(true)
    })
})
