import { describe, expect, it } from "vitest"
import { envToDockerArgs, envToJson, envToYaml, parseEnvFile } from "@/features/tools/env-parser/utils"

describe("env parser utils", () => {
    it("parses comments, blanks, and quoted values", () => {
        const parsed = parseEnvFile("# App\nPORT=3000\nSECRET=\"quoted value\"\n\nFLAG=true")

        expect(parsed).toEqual([
            { key: "", value: "", comment: "App", isComment: true, isEmpty: false, line: 1 },
            { key: "PORT", value: "3000", isComment: false, isEmpty: false, line: 2 },
            { key: "SECRET", value: "quoted value", isComment: false, isEmpty: false, line: 3 },
            { key: "", value: "", isComment: false, isEmpty: true, line: 4 },
            { key: "FLAG", value: "true", isComment: false, isEmpty: false, line: 5 },
        ])
    })

    it("exports parsed variables to JSON, YAML, and docker args", () => {
        const parsed = parseEnvFile("PORT=3000\nSECRET=\"quoted value\"")

        expect(envToJson(parsed)).toBe("{\n  \"PORT\": \"3000\",\n  \"SECRET\": \"quoted value\"\n}")
        expect(envToYaml(parsed)).toBe("PORT: \"3000\"\nSECRET: \"quoted value\"")
        expect(envToDockerArgs(parsed)).toBe("-e PORT=\"3000\" \\\n  -e SECRET=\"quoted value\"")
    })
})
