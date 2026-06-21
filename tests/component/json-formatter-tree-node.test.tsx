import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { JsonTreeNode } from "@/features/tools/json-formatter/components"
import type { JsonPath, JsonValue } from "@/features/tools/json-formatter/types"

const text = (key: string) => {
    if (key === "tree_lazy_limit") return "{count} more hidden until you expand or search deeper."
    return key
}

const noopPath: (path: JsonPath) => void = () => {}
const noopNode: (path: JsonPath, value: JsonValue) => void = () => {}
const noopRename: (path: JsonPath, key: string) => void = () => {}

describe("JsonTreeNode", () => {
    it("limits initially rendered children for large expanded arrays", () => {
        const largeArray = Array.from({ length: 205 }, (_, index) => index)

        render(
            <JsonTreeNode
                value={largeArray}
                path={[]}
                depth={0}
                expanded={new Set(["$"])}
                matched={new Set()}
                text={text}
                toggleExpand={noopPath}
                handleRenameKey={noopRename}
                handleAddChild={noopPath}
                handleEditNode={noopNode}
                handleDeleteNode={noopPath}
                maxVisibleChildren={200}
            />,
        )

        expect(screen.getByText("[199]")).toBeInTheDocument()
        expect(screen.queryByText("[200]")).not.toBeInTheDocument()
        expect(screen.getByText("5 more hidden until you expand or search deeper.")).toBeInTheDocument()
    })
})
