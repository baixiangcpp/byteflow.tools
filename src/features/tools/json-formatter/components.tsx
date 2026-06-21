import * as React from "react"
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/core/utils/utils"
import { isJsonObject, pathKey, previewValue } from "./logic"
import type { JsonPath, JsonValue } from "./types"

interface JsonTreeNodeProps {
    value: JsonValue
    path: JsonPath
    depth: number
    expanded: Set<string>
    matched: Set<string>
    text: (key: string) => string
    keyName?: string
    parentPath?: JsonPath
    toggleExpand: (path: JsonPath) => void
    handleRenameKey: (parentPath: JsonPath, currentKey: string) => void
    handleAddChild: (path: JsonPath) => void
    handleEditNode: (path: JsonPath, currentValue: JsonValue) => void
    handleDeleteNode: (path: JsonPath) => void
    maxVisibleChildren?: number
}

export function JsonTreeNode({
    value,
    path,
    depth,
    expanded,
    matched,
    text,
    keyName,
    parentPath,
    toggleExpand,
    handleRenameKey,
    handleAddChild,
    handleEditNode,
    handleDeleteNode,
    maxVisibleChildren = 200,
}: JsonTreeNodeProps): React.ReactNode {
    const key = pathKey(path)
    const isExpandable = Array.isArray(value) || isJsonObject(value)
    const isOpen = expanded.has(key)
    const isMatched = matched.has(key)

    const arrayChildren = Array.isArray(value) && isOpen ? value.slice(0, maxVisibleChildren) : []
    const objectChildren = isJsonObject(value) && isOpen ? Object.entries(value).slice(0, maxVisibleChildren) : []
    const totalChildren = Array.isArray(value)
        ? value.length
        : isJsonObject(value)
            ? Object.keys(value).length
            : 0
    const visibleChildren = Array.isArray(value) ? arrayChildren.length : objectChildren.length
    const hiddenChildren = Math.max(0, totalChildren - visibleChildren)

    return (
        <div key={key}>
            <div 
                className={cn(
                    "flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted/40",
                    isMatched && "bg-primary/20 hover:bg-primary/30"
                )} 
                style={{ paddingLeft: depth * 14 }}
            >
                {isExpandable ? (
                    <button
                        type="button"
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                        onClick={() => toggleExpand(path)}
                    >
                        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                ) : (
                    <span className="w-4" />
                )}

                <span className="font-mono text-primary">{keyName !== undefined ? keyName : text("tree_root")}</span>
                <span className="text-muted-foreground">{previewValue(value)}</span>

                <div className="ml-auto flex items-center gap-1">
                    {parentPath && keyName !== undefined ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRenameKey(parentPath, keyName)}
                        >
                            <Pencil className="h-3 w-3" />
                            <span className="sr-only">{text("rename_key_action")}</span>
                        </Button>
                    ) : null}
                    {isExpandable ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleAddChild(path)}
                        >
                            <Plus className="h-3 w-3" />
                            <span className="sr-only">{text("add_child_action")}</span>
                        </Button>
                    ) : null}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEditNode(path, value)}
                    >
                        <Pencil className="h-3 w-3" />
                        <span className="sr-only">{text("edit_node_action")}</span>
                    </Button>
                    {path.length > 0 ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => handleDeleteNode(path)}
                        >
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">{text("delete_node_action")}</span>
                        </Button>
                    ) : null}
                </div>
            </div>

            {isExpandable && isOpen ? (
                <div>
                    {Array.isArray(value)
                        ? arrayChildren.map((item, index) => (
                            <JsonTreeNode
                                key={pathKey([...path, index])}
                                value={item}
                                path={[...path, index]}
                                depth={depth + 1}
                                expanded={expanded}
                                matched={matched}
                                text={text}
                                keyName={`[${index}]`}
                                parentPath={path}
                                toggleExpand={toggleExpand}
                                handleRenameKey={handleRenameKey}
                                handleAddChild={handleAddChild}
                                handleEditNode={handleEditNode}
                                handleDeleteNode={handleDeleteNode}
                                maxVisibleChildren={maxVisibleChildren}
                            />
                        ))
                        : objectChildren.map(([childKey, childValue]) => (
                            <JsonTreeNode
                                key={pathKey([...path, childKey])}
                                value={childValue}
                                path={[...path, childKey]}
                                depth={depth + 1}
                                expanded={expanded}
                                matched={matched}
                                text={text}
                                keyName={childKey}
                                parentPath={path}
                                toggleExpand={toggleExpand}
                                handleRenameKey={handleRenameKey}
                                handleAddChild={handleAddChild}
                                handleEditNode={handleEditNode}
                                handleDeleteNode={handleDeleteNode}
                                maxVisibleChildren={maxVisibleChildren}
                            />
                        ))}
                    {hiddenChildren > 0 ? (
                        <div
                            className="px-2 py-1 text-xs text-muted-foreground"
                            style={{ paddingLeft: (depth + 1) * 14 }}
                        >
                            {text("tree_lazy_limit").replace("{count}", String(hiddenChildren))}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}
