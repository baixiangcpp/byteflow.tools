import YAML from "yaml"

export type StructuredDataFormat = "json" | "yaml" | "xml"

export interface DataTreeNode {
    id: string
    key: string
    path: string
    type: string
    valuePreview: string
    children: DataTreeNode[]
}

export interface DataGraphEdge {
    from: string
    to: string
    label: string
}

export interface BuildTreeOptions {
    maxNodes?: number
    maxDepth?: number
}

export interface StructuredDataResult {
    root: DataTreeNode | null
    edges: DataGraphEdge[]
    stats: {
        nodes: number
        objects: number
        arrays: number
        scalars: number
        maxDepth: number
    }
    truncated: boolean
    maxNodes: number
    maxDepth: number
    maxNodesReached: boolean
    maxDepthReached: boolean
    error?: string
}

export const DEFAULT_MAX_NODES = 5000
export const DEFAULT_MAX_DEPTH = 80

type BuildTreeContext = {
    maxNodes: number
    maxDepth: number
    nodes: number
    truncated: boolean
    maxNodesReached: boolean
    maxDepthReached: boolean
}

function scalarPreview(value: unknown): string {
    if (value === null) return "null"
    if (typeof value === "string") return value.length > 80 ? `${value.slice(0, 77)}...` : value
    if (typeof value === "number" || typeof value === "boolean") return String(value)
    return ""
}

function valueType(value: unknown): string {
    if (Array.isArray(value)) return "array"
    if (value === null) return "null"
    return typeof value === "object" ? "object" : typeof value
}

function normalizeBuildOptions(options: BuildTreeOptions = {}): Pick<BuildTreeContext, "maxNodes" | "maxDepth"> {
    return {
        maxNodes: Math.max(1, Math.floor(options.maxNodes ?? DEFAULT_MAX_NODES)),
        maxDepth: Math.max(0, Math.floor(options.maxDepth ?? DEFAULT_MAX_DEPTH)),
    }
}

function createTreeNode(value: unknown, key: string, path: string): DataTreeNode {
    const type = valueType(value)
    return {
        id: path,
        key,
        path,
        type,
        valuePreview: scalarPreview(value),
        children: [],
    }
}

function markMaxNodesReached(node: DataTreeNode): void {
    node.valuePreview = `${node.valuePreview} (truncated: max nodes reached)`
}

function markMaxDepthReached(node: DataTreeNode): void {
    node.valuePreview = `${node.valuePreview} (truncated: max depth reached)`
}

function canAddChild(context: BuildTreeContext): boolean {
    if (context.nodes < context.maxNodes) return true
    context.truncated = true
    context.maxNodesReached = true
    return false
}

function buildValueTree(value: unknown, key: string, path: string, depth: number, context: BuildTreeContext): DataTreeNode {
    context.nodes += 1
    const node = createTreeNode(value, key, path)

    if (depth >= context.maxDepth) {
        if ((Array.isArray(value) && value.length > 0) || (value && typeof value === "object" && Object.keys(value as Record<string, unknown>).length > 0)) {
            context.truncated = true
            context.maxDepthReached = true
            markMaxDepthReached(node)
        }
        return node
    }

    if (Array.isArray(value)) {
        node.valuePreview = `${value.length} item(s)`
        for (let index = 0; index < value.length; index += 1) {
            if (!canAddChild(context)) {
                markMaxNodesReached(node)
                break
            }
            node.children.push(buildValueTree(value[index], String(index), `${path}[${index}]`, depth + 1, context))
        }
    } else if (value && typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>)
        node.valuePreview = `${entries.length} field(s)`
        for (const [childKey, childValue] of entries) {
            if (!canAddChild(context)) {
                markMaxNodesReached(node)
                break
            }
            node.children.push(buildValueTree(childValue, childKey, `${path}.${childKey}`, depth + 1, context))
        }
    }

    return node
}

function buildXmlElementTree(element: Element, key: string, path: string, depth: number, context: BuildTreeContext): DataTreeNode {
    context.nodes += 1
    const node = createTreeNode({}, key, path)
    node.valuePreview = `${element.attributes.length} attribute(s), ${element.children.length} child element(s)`

    if (depth >= context.maxDepth) {
        if (element.attributes.length > 0 || element.childNodes.length > 0) {
            context.truncated = true
            context.maxDepthReached = true
            markMaxDepthReached(node)
        }
        return node
    }

    if (element.attributes.length > 0) {
        if (canAddChild(context)) {
            context.nodes += 1
            const attributesNode = createTreeNode({}, "@attributes", `${path}.@attributes`)
            attributesNode.valuePreview = `${element.attributes.length} field(s)`

            if (depth + 1 >= context.maxDepth) {
                context.truncated = true
                context.maxDepthReached = true
                markMaxDepthReached(attributesNode)
            } else {
                for (let index = 0; index < element.attributes.length; index += 1) {
                    const attribute = element.attributes.item(index)
                    if (!attribute) continue
                    if (!canAddChild(context)) {
                        markMaxNodesReached(attributesNode)
                        break
                    }
                    attributesNode.children.push(buildValueTree(attribute.value, attribute.name, `${attributesNode.path}.${attribute.name}`, depth + 2, context))
                }
            }

            node.children.push(attributesNode)
        } else {
            markMaxNodesReached(node)
            return node
        }
    }

    const textParts: string[] = []
    for (let index = 0; index < element.childNodes.length; index += 1) {
        const childNode = element.childNodes.item(index)
        if (childNode.nodeType === Node.TEXT_NODE) {
            const text = childNode.textContent?.trim()
            if (text) textParts.push(text)
        }
    }

    if (textParts.length > 0) {
        if (canAddChild(context)) {
            node.children.push(buildValueTree(textParts.join(" "), "#text", `${path}.#text`, depth + 1, context))
        } else {
            markMaxNodesReached(node)
            return node
        }
    }

    const tagCounts = new Map<string, number>()
    for (let index = 0; index < element.children.length; index += 1) {
        const child = element.children.item(index)
        if (!child) continue
        if (!canAddChild(context)) {
            markMaxNodesReached(node)
            break
        }

        const count = tagCounts.get(child.tagName) ?? 0
        tagCounts.set(child.tagName, count + 1)
        const childPath = count === 0 ? `${path}.${child.tagName}` : `${path}.${child.tagName}[${count}]`
        node.children.push(buildXmlElementTree(child, child.tagName, childPath, depth + 1, context))
    }

    return node
}

function parseScalarInput(input: string, format: Exclude<StructuredDataFormat, "xml">): unknown {
    if (format === "json") return JSON.parse(input)
    return YAML.parse(input)
}

function parseXmlDocument(input: string): Document {
    if (typeof DOMParser === "undefined") {
        throw new Error("XML parsing requires a browser DOMParser runtime.")
    }

    const document = new DOMParser().parseFromString(input, "application/xml")
    const parserError = document.querySelector("parsererror")
    if (parserError) throw new Error(parserError.textContent?.trim() || "Invalid XML input.")
    if (!document.documentElement) throw new Error("XML document has no root element.")
    return document
}

function collectStats(node: DataTreeNode, depth = 0): StructuredDataResult["stats"] {
    const own = {
        nodes: 1,
        objects: node.type === "object" ? 1 : 0,
        arrays: node.type === "array" ? 1 : 0,
        scalars: node.children.length === 0 ? 1 : 0,
        maxDepth: depth,
    }

    for (const child of node.children) {
        const childStats = collectStats(child, depth + 1)
        own.nodes += childStats.nodes
        own.objects += childStats.objects
        own.arrays += childStats.arrays
        own.scalars += childStats.scalars
        own.maxDepth = Math.max(own.maxDepth, childStats.maxDepth)
    }

    return own
}

function collectEdges(node: DataTreeNode, limit = 250): DataGraphEdge[] {
    const edges: DataGraphEdge[] = []
    const walk = (current: DataTreeNode) => {
        if (edges.length >= limit) return
        for (const child of current.children) {
            if (edges.length >= limit) return
            edges.push({ from: current.id, to: child.id, label: child.key })
            walk(child)
        }
    }
    walk(node)
    return edges
}

export function visualizeStructuredData(input: string, format: StructuredDataFormat, options: BuildTreeOptions = {}): StructuredDataResult {
    try {
        const limits = normalizeBuildOptions(options)
        const context: BuildTreeContext = {
            ...limits,
            nodes: 0,
            truncated: false,
            maxNodesReached: false,
            maxDepthReached: false,
        }
        const root = format === "xml"
            ? (() => {
                const document = parseXmlDocument(input)
                const wrapper = createTreeNode({}, "$", "$")
                context.nodes += 1
                wrapper.valuePreview = "1 field(s)"
                if (canAddChild(context)) {
                    const element = document.documentElement
                    wrapper.children.push(buildXmlElementTree(element, element.tagName, `$.${element.tagName}`, 1, context))
                } else {
                    markMaxNodesReached(wrapper)
                }
                return wrapper
            })()
            : buildValueTree(parseScalarInput(input, format), "$", "$", 0, context)

        return {
            root,
            edges: collectEdges(root),
            stats: collectStats(root),
            truncated: context.truncated,
            maxNodes: context.maxNodes,
            maxDepth: context.maxDepth,
            maxNodesReached: context.maxNodesReached,
            maxDepthReached: context.maxDepthReached,
        }
    } catch (error) {
        const limits = normalizeBuildOptions(options)
        return {
            root: null,
            edges: [],
            stats: { nodes: 0, objects: 0, arrays: 0, scalars: 0, maxDepth: 0 },
            truncated: false,
            maxNodes: limits.maxNodes,
            maxDepth: limits.maxDepth,
            maxNodesReached: false,
            maxDepthReached: false,
            error: error instanceof Error ? error.message : "Unable to parse structured data.",
        }
    }
}
