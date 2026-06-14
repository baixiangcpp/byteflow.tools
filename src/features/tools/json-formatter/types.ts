export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type JsonPath = Array<string | number>

export type ViewMode = "text" | "tree"
export type TreeDialogState =
    | {
        type: "edit_value"
        path: JsonPath
        draft: string
    }
    | {
        type: "add_key"
        path: JsonPath
        draft: string
    }
    | {
        type: "rename_key"
        parentPath: JsonPath
        currentKey: string
        draft: string
    }
    | null
