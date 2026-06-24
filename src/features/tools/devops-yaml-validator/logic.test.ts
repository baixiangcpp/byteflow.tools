import { describe, expect, it } from "vitest"
import { validateDevopsYaml } from "./logic"

describe("devops-yaml-validator logic", () => {
    it("validates Docker Compose services locally", () => {
        const report = validateDevopsYaml("services:\n  web:\n    ports:\n      - 8080:80\n")
        expect(report.dockerComposeServices).toBe(1)
        expect(report.issues.some((entry) => entry.message.includes("image or build"))).toBe(true)
    })

    it("validates Kubernetes deployment structure", () => {
        const report = validateDevopsYaml("apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: app\nspec: {}\n")
        expect(report.kubernetesResources).toBe(1)
        expect(report.issues.some((entry) => entry.path.includes("containers"))).toBe(true)
    })

    it("reports YAML syntax errors", () => {
        expect(validateDevopsYaml("services:\n  web: [").issues[0].fix).toContain("Fix YAML syntax")
    })
})
