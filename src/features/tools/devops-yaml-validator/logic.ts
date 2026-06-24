import YAML from "yaml"
import type { DevopsYamlIssue, DevopsYamlReport } from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function issue(path: string, severity: "error" | "warning", message: string, fix: string): DevopsYamlIssue {
    return { path, severity, message, fix }
}

function validateCompose(yamlDoc: Record<string, unknown>, issues: DevopsYamlIssue[]): number {
    if (!isRecord(yamlDoc.services)) return 0
    const services = yamlDoc.services
    for (const [name, service] of Object.entries(services)) {
        if (!isRecord(service)) {
            issues.push(issue(`services.${name}`, "error", "Service must be an object.", "Use a mapping with image/build and service options."))
            continue
        }
        if (typeof service.image !== "string" && typeof service.build !== "string" && !isRecord(service.build)) {
            issues.push(issue(`services.${name}`, "error", "Service needs image or build.", "Add an image reference or build context."))
        }
        if (Array.isArray(service.ports)) {
            for (const [index, port] of service.ports.entries()) {
                if (typeof port !== "string" && typeof port !== "number") {
                    issues.push(issue(`services.${name}.ports[${index}]`, "error", "Port mapping must be a string or number.", "Use values like \"8080:80\"."))
                }
            }
        }
        if (service.privileged === true) {
            issues.push(issue(`services.${name}.privileged`, "warning", "Privileged containers expand host access.", "Remove privileged unless the workload requires it."))
        }
    }
    return Object.keys(services).length
}

function validateKubernetes(yamlDoc: Record<string, unknown>, index: number, issues: DevopsYamlIssue[]): number {
    if (typeof yamlDoc.kind !== "string" && typeof yamlDoc.apiVersion !== "string") return 0
    const basePath = `documents[${index}]`
    if (typeof yamlDoc.apiVersion !== "string") {
        issues.push(issue(`${basePath}.apiVersion`, "error", "Kubernetes manifest is missing apiVersion.", "Add apiVersion such as apps/v1 or v1."))
    }
    if (typeof yamlDoc.kind !== "string") {
        issues.push(issue(`${basePath}.kind`, "error", "Kubernetes manifest is missing kind.", "Add kind such as Deployment, Service, or ConfigMap."))
    }
    if (!isRecord(yamlDoc.metadata) || typeof yamlDoc.metadata.name !== "string") {
        issues.push(issue(`${basePath}.metadata.name`, "error", "metadata.name is required.", "Add a stable resource name."))
    }
    if (yamlDoc.kind === "Deployment") {
        const spec = isRecord(yamlDoc.spec) ? yamlDoc.spec : {}
        const selector = isRecord(spec.selector) ? spec.selector : undefined
        const template = isRecord(spec.template) ? spec.template : undefined
        if (!selector) issues.push(issue(`${basePath}.spec.selector`, "error", "Deployment selector is required.", "Add spec.selector.matchLabels."))
        if (!template) issues.push(issue(`${basePath}.spec.template`, "error", "Deployment pod template is required.", "Add spec.template with metadata and spec."))
        const containers = isRecord(template?.spec) && Array.isArray(template.spec.containers) ? template.spec.containers : []
        if (containers.length === 0) {
            issues.push(issue(`${basePath}.spec.template.spec.containers`, "error", "Deployment needs at least one container.", "Add a container with name and image."))
        }
        containers.forEach((container, containerIndex) => {
            if (!isRecord(container)) return
            if (typeof container.image !== "string") {
                issues.push(issue(`${basePath}.spec.template.spec.containers[${containerIndex}].image`, "error", "Container image is required.", "Add a pinned image reference."))
            } else if (container.image.endsWith(":latest")) {
                issues.push(issue(`${basePath}.spec.template.spec.containers[${containerIndex}].image`, "warning", "Avoid :latest for reproducible deployments.", "Pin an explicit image tag or digest."))
            }
        })
    }
    return 1
}

export function validateDevopsYaml(input: string): DevopsYamlReport {
    const documents = YAML.parseAllDocuments(input).filter((yamlDoc) => yamlDoc.contents !== null)
    const issues: DevopsYamlIssue[] = []
    const yamlErrors = documents.flatMap((yamlDoc) => yamlDoc.errors)
    if (yamlErrors.length > 0) {
        return {
            documentCount: documents.length,
            dockerComposeServices: 0,
            kubernetesResources: 0,
            issues: yamlErrors.map((error) => issue("$", "error", error.message, "Fix YAML syntax before validating structure.")),
        }
    }
    let composeServices = 0
    let kubernetesResources = 0
    documents.forEach((yamlDoc, index) => {
        const value = yamlDoc.toJSON()
        if (!isRecord(value)) {
            issues.push(issue(`documents[${index}]`, "error", "YAML document must be a mapping/object.", "Use key-value YAML for Compose or Kubernetes resources."))
            return
        }
        composeServices += validateCompose(value, issues)
        kubernetesResources += validateKubernetes(value, index, issues)
    })
    if (composeServices === 0 && kubernetesResources === 0) {
        issues.push(issue("$", "warning", "No Docker Compose services or Kubernetes resources were detected.", "Paste a Compose file with services or Kubernetes manifests with apiVersion/kind."))
    }
    return {
        documentCount: documents.length,
        dockerComposeServices: composeServices,
        kubernetesResources,
        issues,
    }
}

export function formatDevopsYamlReport(report: DevopsYamlReport): string {
    return [
        `Documents: ${report.documentCount}`,
        `Compose services: ${report.dockerComposeServices}`,
        `Kubernetes resources: ${report.kubernetesResources}`,
        "",
        report.issues.length === 0 ? "No issues found." : "Issues:",
        ...report.issues.map((entry) => `[${entry.severity}] ${entry.path}: ${entry.message} Fix: ${entry.fix}`),
    ].join("\n")
}

export function runTool(input: string): string {
    return formatDevopsYamlReport(validateDevopsYaml(input))
}
