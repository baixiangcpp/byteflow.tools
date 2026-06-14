/**
 * Docker run command parser and docker-compose.yml generator
 */

export interface DockerRunOptions {
    image: string
    command?: string[]
    containerName?: string
    detached?: boolean
    ports?: string[]
    env?: Record<string, string>
    envFiles?: string[]
    volumes?: string[]
    restart?: string
    network?: string
    hostname?: string
    user?: string
    workdir?: string
    entrypoint?: string
    labels?: Record<string, string>
    privileged?: boolean
    remove?: boolean
    platform?: string
}

export interface ParseResult {
    options: DockerRunOptions
    warnings: string[]
    unknownFlags: string[]
}

export interface ComposeService {
    image?: string
    container_name?: string
    command?: string | string[]
    ports?: string[]
    environment?: Record<string, string> | string[]
    env_file?: string | string[]
    volumes?: string[]
    restart?: string
    network_mode?: string
    hostname?: string
    user?: string
    working_dir?: string
    entrypoint?: string | string[]
    labels?: Record<string, string> | string[]
    privileged?: boolean
    platform?: string
}

const UNSUPPORTED_BOOLEAN_FLAGS = new Set([
    "--init",
    "--oom-kill-disable",
    "--read-only",
])

const UNSUPPORTED_VALUE_FLAGS = new Set([
    "--add-host",
    "--cidfile",
    "--cpus",
    "--dns",
    "--dns-search",
    "--expose",
    "--health-cmd",
    "--health-interval",
    "--health-retries",
    "--health-timeout",
    "--ip",
    "--log-driver",
    "--log-opt",
    "--memory",
    "--pull",
])

function splitLongFlag(token: string): { flag: string; inlineValue?: string } {
    const eqIndex = token.indexOf("=")
    if (eqIndex === -1 || !token.startsWith("--")) {
        return { flag: token }
    }

    return {
        flag: token.slice(0, eqIndex),
        inlineValue: token.slice(eqIndex + 1),
    }
}

function readFlagValue(tokens: string[], index: number, inlineValue?: string): { value?: string; nextIndex: number } {
    if (inlineValue !== undefined) {
        return { value: inlineValue, nextIndex: index + 1 }
    }

    return { value: tokens[index + 1], nextIndex: index + 2 }
}

function splitKeyValue(value: string): [string, string] {
    const [key, ...rest] = value.split("=")
    return [key, rest.join("=")]
}

/**
 * Parse docker run command into structured options
 */
export function parseDockerRun(command: string): ParseResult {
    const options: DockerRunOptions = {
        image: "",
        env: {},
        labels: {},
    }
    const warnings: string[] = []
    const unknownFlags: string[] = []

    // Remove leading "docker run" and normalize whitespace
    let cmd = command.trim()
    if (cmd.startsWith("docker run")) {
        cmd = cmd.slice(10).trim()
    }

    // Simple tokenizer - handles quoted strings
    const tokens: string[] = []
    let current = ""
    let inQuote: string | null = null

    for (let i = 0; i < cmd.length; i++) {
        const char = cmd[i]

        if (inQuote) {
            if (char === inQuote && (i === 0 || cmd[i - 1] !== "\\")) {
                inQuote = null
            } else {
                current += char
            }
        } else if (char === '"' || char === "'") {
            inQuote = char
        } else if (char === " " || char === "\t" || char === "\n") {
            if (current) {
                tokens.push(current)
                current = ""
            }
        } else {
            current += char
        }
    }
    if (current) tokens.push(current)

    // Parse tokens
    let i = 0
    while (i < tokens.length) {
        const token = tokens[i]

        if (token.startsWith("-")) {
            const parsedFlag = splitLongFlag(token)
            const shortValue = token.length > 2 ? token.slice(2) : undefined
            const flag = !token.startsWith("--") && ["-p", "-e", "-v", "-u", "-w", "-l"].includes(token.slice(0, 2))
                ? token.slice(0, 2)
                : parsedFlag.flag
            const inlineValue = parsedFlag.inlineValue

            if (flag === "-d" || flag === "--detach") {
                options.detached = true
                i++
            } else if (flag === "-p" || flag === "--publish") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue ?? (flag === "-p" ? shortValue : undefined))
                if (value) {
                    options.ports = options.ports || []
                    options.ports.push(value)
                }
                i = nextIndex
            } else if (flag === "-e" || flag === "--env") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue ?? (flag === "-e" ? shortValue : undefined))
                if (value) {
                    const [key, envValue] = splitKeyValue(value)
                    options.env![key] = envValue || ""
                }
                i = nextIndex
            } else if (flag === "--env-file") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue)
                if (value) {
                    options.envFiles = options.envFiles || []
                    options.envFiles.push(value)
                }
                i = nextIndex
            } else if (flag === "-v" || flag === "--volume") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue ?? (flag === "-v" ? shortValue : undefined))
                if (value) {
                    options.volumes = options.volumes || []
                    options.volumes.push(value)
                }
                i = nextIndex
            } else if (flag === "--mount") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue)
                warnings.push(`--mount is not converted automatically. Review mount manually: ${value || "(missing value)"}`)
                i = nextIndex
            } else if (flag === "--name") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue)
                options.containerName = value
                i = nextIndex
            } else if (flag === "--restart") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue)
                options.restart = value
                i = nextIndex
            } else if (flag === "--network") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue)
                options.network = value
                i = nextIndex
            } else if (flag === "--hostname") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue)
                options.hostname = value
                i = nextIndex
            } else if (flag === "--user" || flag === "-u") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue ?? (flag === "-u" ? shortValue : undefined))
                options.user = value
                i = nextIndex
            } else if (flag === "--workdir" || flag === "-w") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue ?? (flag === "-w" ? shortValue : undefined))
                options.workdir = value
                i = nextIndex
            } else if (flag === "--entrypoint") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue)
                options.entrypoint = value
                i = nextIndex
            } else if (flag === "--label" || flag === "-l") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue ?? (flag === "-l" ? shortValue : undefined))
                if (value) {
                    const [key, labelValue] = splitKeyValue(value)
                    options.labels![key] = labelValue || ""
                }
                i = nextIndex
            } else if (flag === "--privileged") {
                options.privileged = true
                i++
            } else if (flag === "--rm") {
                options.remove = true
                warnings.push("--rm has no direct compose equivalent. Container will persist after exit in compose.")
                i++
            } else if (flag === "--platform") {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue)
                options.platform = value
                i = nextIndex
            } else if (flag === "-it" || flag === "-i" || flag === "-t") {
                // Interactive/tty - not relevant for compose
                i++
            } else if (UNSUPPORTED_BOOLEAN_FLAGS.has(flag)) {
                unknownFlags.push(flag)
                warnings.push(`${flag} is not converted to compose automatically. Review the service manually.`)
                i++
            } else if (UNSUPPORTED_VALUE_FLAGS.has(flag)) {
                const { value, nextIndex } = readFlagValue(tokens, i, inlineValue)
                unknownFlags.push(value ? `${flag} ${value}` : flag)
                warnings.push(`${flag}${value ? ` ${value}` : ""} is not converted to compose automatically. Review the service manually.`)
                i = nextIndex
            } else {
                unknownFlags.push(flag)
                i++
            }
        } else {
            // Should be image (first non-flag) or command args
            if (!options.image) {
                options.image = token
                i++
                // Everything after image is command
                if (i < tokens.length) {
                    options.command = tokens.slice(i)
                }
                break
            } else {
                i++
            }
        }
    }

    if (!options.image) {
        warnings.push("No image specified")
    }

    if (unknownFlags.length > 0) {
        warnings.push(`Unknown flags: ${unknownFlags.join(", ")}`)
    }

    return { options, warnings, unknownFlags }
}

/**
 * Generate docker-compose service definition from parsed options
 */
export function generateComposeService(options: DockerRunOptions): ComposeService {
    const service: ComposeService = {}

    if (options.image) {
        service.image = options.image
    }

    if (options.containerName) {
        service.container_name = options.containerName
    }

    if (options.command && options.command.length > 0) {
        service.command = options.command.length === 1 ? options.command[0] : options.command
    }

    if (options.ports && options.ports.length > 0) {
        service.ports = options.ports
    }

    if (options.env && Object.keys(options.env).length > 0) {
        service.environment = options.env
    }

    if (options.envFiles && options.envFiles.length > 0) {
        service.env_file = options.envFiles.length === 1 ? options.envFiles[0] : options.envFiles
    }

    if (options.volumes && options.volumes.length > 0) {
        service.volumes = options.volumes
    }

    if (options.restart) {
        service.restart = options.restart
    }

    if (options.network) {
        // Use network_mode for simple cases
        service.network_mode = options.network
    }

    if (options.hostname) {
        service.hostname = options.hostname
    }

    if (options.user) {
        service.user = options.user
    }

    if (options.workdir) {
        service.working_dir = options.workdir
    }

    if (options.entrypoint) {
        service.entrypoint = options.entrypoint
    }

    if (options.labels && Object.keys(options.labels).length > 0) {
        service.labels = options.labels
    }

    if (options.privileged) {
        service.privileged = true
    }

    if (options.platform) {
        service.platform = options.platform
    }

    return service
}

/**
 * Convert service object to YAML string
 */
export function serviceToYAML(serviceName: string, service: ComposeService): string {
    const lines: string[] = []

    lines.push(`${serviceName}:`)

    if (service.image) {
        lines.push(`  image: ${quoteYamlString(service.image)}`)
    }

    if (service.container_name) {
        lines.push(`  container_name: ${quoteYamlString(service.container_name)}`)
    }

    if (service.command) {
        if (Array.isArray(service.command)) {
            lines.push(`  command:`)
            service.command.forEach((cmd) => {
                lines.push(`    - ${quoteYamlString(cmd)}`)
            })
        } else {
            lines.push(`  command: ${quoteYamlString(service.command)}`)
        }
    }

    if (service.ports && service.ports.length > 0) {
        lines.push(`  ports:`)
        service.ports.forEach((port) => {
            lines.push(`    - "${port}"`)
        })
    }

    if (service.environment) {
        lines.push(`  environment:`)
        if (typeof service.environment === "object" && !Array.isArray(service.environment)) {
            Object.entries(service.environment).forEach(([key, value]) => {
                lines.push(`    ${key}: ${quoteYamlString(value)}`)
            })
        }
    }

    if (service.env_file) {
        if (Array.isArray(service.env_file)) {
            lines.push(`  env_file:`)
            service.env_file.forEach((file) => {
                lines.push(`    - ${quoteYamlString(file)}`)
            })
        } else {
            lines.push(`  env_file: ${quoteYamlString(service.env_file)}`)
        }
    }

    if (service.volumes && service.volumes.length > 0) {
        lines.push(`  volumes:`)
        service.volumes.forEach((vol) => {
            lines.push(`    - ${quoteYamlString(vol)}`)
        })
    }

    if (service.restart) {
        lines.push(`  restart: ${quoteYamlString(service.restart)}`)
    }

    if (service.network_mode) {
        lines.push(`  network_mode: ${quoteYamlString(service.network_mode)}`)
    }

    if (service.hostname) {
        lines.push(`  hostname: ${quoteYamlString(service.hostname)}`)
    }

    if (service.user) {
        lines.push(`  user: ${quoteYamlString(service.user)}`)
    }

    if (service.working_dir) {
        lines.push(`  working_dir: ${quoteYamlString(service.working_dir)}`)
    }

    if (service.entrypoint) {
        lines.push(`  entrypoint: ${quoteYamlString(Array.isArray(service.entrypoint) ? service.entrypoint.join(" ") : service.entrypoint)}`)
    }

    if (service.labels) {
        lines.push(`  labels:`)
        if (typeof service.labels === "object" && !Array.isArray(service.labels)) {
            Object.entries(service.labels).forEach(([key, value]) => {
                lines.push(`    ${key}: ${quoteYamlString(value)}`)
            })
        }
    }

    if (service.privileged) {
        lines.push(`  privileged: true`)
    }

    if (service.platform) {
        lines.push(`  platform: ${quoteYamlString(service.platform)}`)
    }

    return lines.join("\n")
}

function quoteYamlString(value: string): string {
    return JSON.stringify(value)
}

/**
 * Infer service name from image or container name
 */
export function inferServiceName(options: DockerRunOptions): string {
    if (options.containerName) {
        return options.containerName
    }

    if (options.image) {
        // Extract name from image (e.g., "redis:7" -> "redis", "docker.io/library/nginx:alpine" -> "nginx")
        const imageParts = options.image.split("/")
        const lastPart = imageParts[imageParts.length - 1]
        const nameWithoutTag = lastPart.split(":")[0]
        return nameWithoutTag
    }

    return "app"
}
