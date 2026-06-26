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

    it("handles empty, malformed, and large env files without dropping secrets from expected exports", () => {
        expect(parseEnvFile("")).toEqual([{ key: "", value: "", isComment: false, isEmpty: true, line: 1 }])
        expect(parseEnvFile("MALFORMED_LINE")[0]).toMatchObject({
            key: "MALFORMED_LINE",
            value: "",
            line: 1,
        })

        const large = Array.from({ length: 500 }, (_, index) => `SECRET_${index}=value-${index}`).join("\n")
        const parsed = parseEnvFile(large)
        const exported = envToJson(parsed)

        expect(parsed).toHaveLength(500)
        expect(exported).toContain('"SECRET_499": "value-499"')
        expect(envToDockerArgs(parsed)).toContain('-e SECRET_499="value-499"')
        expect(envToYaml(parsed)).toContain('SECRET_499: "value-499"')
    })
})
