import type { JsonPath, JsonValue } from "./types"

export function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function pathKey(path: JsonPath): string {
    if (path.length === 0) return "$"
    return path.map((part) => String(part)).join("__")
}

export function getValueAtPath(root: JsonValue, path: JsonPath): JsonValue {
    let current: JsonValue = root
    for (const part of path) {
        if (Array.isArray(current) && typeof part === "number") {
            current = current[part]
            continue
        }
        if (isJsonObject(current) && typeof part === "string") {
            current = current[part]
            continue
        }
        return root
    }
    return current
}

export function updateValueAtPath(root: JsonValue, path: JsonPath, nextValue: JsonValue): JsonValue {
    if (path.length === 0) return nextValue

    const [head, ...rest] = path

    if (Array.isArray(root) && typeof head === "number") {
        const copy = [...root]
        copy[head] = updateValueAtPath(copy[head], rest, nextValue)
        return copy
    }

    if (isJsonObject(root) && typeof head === "string") {
        return {
            ...root,
            [head]: updateValueAtPath(root[head], rest, nextValue),
        }
    }

    return root
}

export function removeValueAtPath(root: JsonValue, path: JsonPath): JsonValue {
    if (path.length === 0) return root

    const parentPath = path.slice(0, -1)
    const target = path[path.length - 1]
    const parent = getValueAtPath(root, parentPath)

    if (Array.isArray(parent) && typeof target === "number") {
        const copy = [...parent]
        copy.splice(target, 1)
        return updateValueAtPath(root, parentPath, copy)
    }

    if (isJsonObject(parent) && typeof target === "string") {
        const rest = { ...parent }
        delete rest[target]
        return updateValueAtPath(root, parentPath, rest)
    }

    return root
}

export function renameObjectKey(root: JsonValue, parentPath: JsonPath, fromKey: string, toKey: string): JsonValue {
    const parent = getValueAtPath(root, parentPath)
    if (!isJsonObject(parent) || !toKey || fromKey === toKey) return root
    if (Object.prototype.hasOwnProperty.call(parent, toKey)) return root

    const renamed: { [key: string]: JsonValue } = {}
    for (const [key, value] of Object.entries(parent)) {
        if (key === fromKey) {
            renamed[toKey] = value
        } else {
            renamed[key] = value
        }
    }

    return updateValueAtPath(root, parentPath, renamed)
}

export function previewValue(value: JsonValue): string {
    if (Array.isArray(value)) return `[${value.length}]`
    if (isJsonObject(value)) return `{${Object.keys(value).length}}`
    if (typeof value === "string") return `\"${value}\"`
    if (value === null) return "null"
    return String(value)
}

export function getAllPaths(value: JsonValue, currentPath: JsonPath = [], paths: Set<string> = new Set()): Set<string> {
    const key = pathKey(currentPath)
    paths.add(key)

    if (Array.isArray(value)) {
        value.forEach((item, index) => getAllPaths(item, [...currentPath, index], paths))
    } else if (isJsonObject(value)) {
        Object.entries(value).forEach(([k, v]) => getAllPaths(v, [...currentPath, k], paths))
    }
    return paths
}

export function findMatchingPaths(
    value: JsonValue,
    query: string,
    currentPath: JsonPath = [],
    results: { matched: Set<string>; parents: Set<string> } = { matched: new Set(), parents: new Set() }
): { matched: Set<string>; parents: Set<string> } {
    if (!query) return results

    const key = pathKey(currentPath)
    const lastPart = currentPath[currentPath.length - 1]
    const stringifiedValue = String(value).toLowerCase()
    const normalizedQuery = query.toLowerCase()

    const isMatch =
        (typeof lastPart === "string" && lastPart.toLowerCase().includes(normalizedQuery)) ||
        stringifiedValue.includes(normalizedQuery)

    if (isMatch) {
        results.matched.add(key)
        for (let i = 0; i < currentPath.length; i++) {
            results.parents.add(pathKey(currentPath.slice(0, i + 1)))
        }
        results.parents.add("$")
    }

    if (Array.isArray(value)) {
        value.forEach((item, index) => findMatchingPaths(item, query, [...currentPath, index], results))
    } else if (isJsonObject(value)) {
        Object.entries(value).forEach(([k, v]) => findMatchingPaths(v, query, [...currentPath, k], results))
    }

    return results
}
