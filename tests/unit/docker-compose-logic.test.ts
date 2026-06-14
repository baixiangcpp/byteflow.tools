/**
 * Tests for docker-compose-utils
 */

import { describe, it, expect } from "vitest"
import YAML from "yaml"
import {
    parseDockerRun,
    generateComposeService,
    serviceToYAML,
    inferServiceName,
} from "../../src/lib/docker-compose-utils"

describe("parseDockerRun", () => {
    it("should parse basic docker run command", () => {
        const cmd = "docker run -d --name redis -p 6379:6379 redis:7"
        const result = parseDockerRun(cmd)

        expect(result.options.image).toBe("redis:7")
        expect(result.options.containerName).toBe("redis")
        expect(result.options.detached).toBe(true)
        expect(result.options.ports).toEqual(["6379:6379"])
    })

    it("should parse environment variables", () => {
        const cmd = "docker run -e POSTGRES_PASSWORD=secret -e DB_NAME=mydb postgres:16"
        const result = parseDockerRun(cmd)

        expect(result.options.env).toEqual({
            POSTGRES_PASSWORD: "secret",
            DB_NAME: "mydb",
        })
    })

    it("should parse volumes", () => {
        const cmd = 'docker run -v pgdata:/var/lib/postgresql/data -v "$PWD:/app" postgres:16'
        const result = parseDockerRun(cmd)

        expect(result.options.volumes).toContain("pgdata:/var/lib/postgresql/data")
        expect(result.options.volumes).toContain("$PWD:/app")
    })

    it("should parse network and restart options", () => {
        const cmd = "docker run --network host --restart unless-stopped nginx:alpine"
        const result = parseDockerRun(cmd)

        expect(result.options.network).toBe("host")
        expect(result.options.restart).toBe("unless-stopped")
    })

    it("should parse equals syntax for long value flags", () => {
        const cmd = "docker run --name=redis --restart=always --publish=6379:6379 redis:7"
        const result = parseDockerRun(cmd)

        expect(result.options.image).toBe("redis:7")
        expect(result.options.containerName).toBe("redis")
        expect(result.options.restart).toBe("always")
        expect(result.options.ports).toEqual(["6379:6379"])
    })

    it("should parse short publish values attached to the flag", () => {
        const cmd = "docker run -p6379:6379 redis:7"
        const result = parseDockerRun(cmd)

        expect(result.options.image).toBe("redis:7")
        expect(result.options.ports).toEqual(["6379:6379"])
    })

    it("should parse env and volume equals syntax", () => {
        const cmd = "docker run --env=KEY=value --volume=data:/data redis:7"
        const result = parseDockerRun(cmd)

        expect(result.options.image).toBe("redis:7")
        expect(result.options.env).toEqual({ KEY: "value" })
        expect(result.options.volumes).toEqual(["data:/data"])
    })

    it("should parse command arguments", () => {
        const cmd = "docker run node:22 npm test"
        const result = parseDockerRun(cmd)

        expect(result.options.image).toBe("node:22")
        expect(result.options.command).toEqual(["npm", "test"])
    })

    it("should warn about --rm flag", () => {
        const cmd = "docker run --rm -it node:22"
        const result = parseDockerRun(cmd)

        expect(result.options.remove).toBe(true)
        expect(result.warnings.length).toBeGreaterThan(0)
        expect(result.warnings[0]).toContain("--rm")
    })

    it("should warn about unsupported boolean flags without swallowing the image", () => {
        const cmd = "docker run --init nginx:alpine"
        const result = parseDockerRun(cmd)

        expect(result.options.image).toBe("nginx:alpine")
        expect(result.unknownFlags).toContain("--init")
        expect(result.warnings.join("\n")).toContain("--init")
    })

    it("should warn about unsupported value flags without swallowing the image", () => {
        const cmd = "docker run --pull always nginx:alpine"
        const result = parseDockerRun(cmd)

        expect(result.options.image).toBe("nginx:alpine")
        expect(result.unknownFlags).toContain("--pull always")
        expect(result.warnings.join("\n")).toContain("--pull always")
    })

    it("should preserve mount details in warnings", () => {
        const cmd = "docker run --mount type=bind,source=.,target=/app node:22"
        const result = parseDockerRun(cmd)

        expect(result.options.image).toBe("node:22")
        expect(result.warnings.join("\n")).toContain("type=bind,source=.,target=/app")
    })

    it("should parse the node command example with remove, volume, workdir, image, and command", () => {
        const cmd = 'docker run --rm -it -v "$PWD:/app" -w /app node:22 npm test'
        const result = parseDockerRun(cmd)

        expect(result.options.image).toBe("node:22")
        expect(result.options.remove).toBe(true)
        expect(result.options.volumes).toEqual(["$PWD:/app"])
        expect(result.options.workdir).toBe("/app")
        expect(result.options.command).toEqual(["npm", "test"])
    })

    it("should handle quoted strings", () => {
        const cmd = 'docker run -e MSG="Hello World" --name "my app" redis'
        const result = parseDockerRun(cmd)

        expect(result.options.env?.MSG).toBe("Hello World")
        expect(result.options.containerName).toBe("my app")
    })
})

describe("generateComposeService", () => {
    it("should generate basic service", () => {
        const options = {
            image: "redis:7",
            containerName: "redis",
            ports: ["6379:6379"],
            env: {},
            labels: {},
        }

        const service = generateComposeService(options)

        expect(service.image).toBe("redis:7")
        expect(service.container_name).toBe("redis")
        expect(service.ports).toEqual(["6379:6379"])
    })

    it("should generate service with environment", () => {
        const options = {
            image: "postgres:16",
            env: { POSTGRES_PASSWORD: "secret" },
            labels: {},
        }

        const service = generateComposeService(options)

        expect(service.environment).toEqual({ POSTGRES_PASSWORD: "secret" })
    })

    it("should generate service with volumes", () => {
        const options = {
            image: "postgres:16",
            volumes: ["pgdata:/var/lib/postgresql/data"],
            env: {},
            labels: {},
        }

        const service = generateComposeService(options)

        expect(service.volumes).toEqual(["pgdata:/var/lib/postgresql/data"])
    })
})

describe("serviceToYAML", () => {
    it("should generate valid YAML", () => {
        const service = {
            image: "redis:7",
            container_name: "redis",
            ports: ["6379:6379"],
        }

        const yaml = serviceToYAML("redis", service)

        expect(yaml).toContain("redis:")
        expect(yaml).toContain('image: "redis:7"')
        expect(yaml).toContain('container_name: "redis"')
        expect(yaml).toContain('- "6379:6379"')
    })

    it("should handle environment variables", () => {
        const service = {
            image: "postgres:16",
            environment: { POSTGRES_PASSWORD: "secret", DB_NAME: "mydb" },
        }

        const yaml = serviceToYAML("db", service)

        expect(yaml).toContain("environment:")
        expect(yaml).toContain('POSTGRES_PASSWORD: "secret"')
        expect(yaml).toContain('DB_NAME: "mydb"')
    })

    it("should handle command arrays", () => {
        const service = {
            image: "node:22",
            command: ["npm", "test"],
        }

        const yaml = serviceToYAML("app", service)

        expect(yaml).toContain("command:")
        expect(yaml).toContain('- "npm"')
        expect(yaml).toContain('- "test"')
    })

    it("should produce a valid YAML service fragment", () => {
        const parseResult = parseDockerRun("docker run --name pg -e POSTGRES_PASSWORD=secret -v pgdata:/var/lib/postgresql/data -p 5432:5432 postgres:16")
        const serviceName = inferServiceName(parseResult.options)
        const service = generateComposeService(parseResult.options)
        const yaml = serviceToYAML(serviceName, service)
        const parsed = YAML.parse(yaml)

        expect(parsed.pg.image).toBe("postgres:16")
        expect(parsed.pg.environment.POSTGRES_PASSWORD).toBe("secret")
        expect(parsed.pg.volumes).toEqual(["pgdata:/var/lib/postgresql/data"])
    })
})

describe("inferServiceName", () => {
    it("should use container name if available", () => {
        const options = {
            image: "redis:7",
            containerName: "my-redis",
            env: {},
            labels: {},
        }

        expect(inferServiceName(options)).toBe("my-redis")
    })

    it("should extract from image name", () => {
        const options = {
            image: "redis:7",
            env: {},
            labels: {},
        }

        expect(inferServiceName(options)).toBe("redis")
    })

    it("should handle registry paths", () => {
        const options = {
            image: "docker.io/library/nginx:alpine",
            env: {},
            labels: {},
        }

        expect(inferServiceName(options)).toBe("nginx")
    })
})
