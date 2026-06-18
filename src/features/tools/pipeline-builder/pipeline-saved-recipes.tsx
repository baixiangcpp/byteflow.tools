import { FolderOpen, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SavedRecipeRecord } from "@/features/pipeline/recipe-store"

type PipelineSavedRecipesProps = {
    onDeleteRecipe: () => void
    onLoadRecipe: () => void
    onSelectedSavedIdChange: (savedId: string) => void
    savedRecipes: SavedRecipeRecord[]
    selectedSavedId: string
    storageAvailable: boolean
    storageMessage: string | null
    text: (key: string) => string
}

export function PipelineSavedRecipes({
    onDeleteRecipe,
    onLoadRecipe,
    onSelectedSavedIdChange,
    savedRecipes,
    selectedSavedId,
    storageAvailable,
    storageMessage,
    text,
}: PipelineSavedRecipesProps) {
    return (
        <section className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">{text("saved_recipes")}</h2>
            <div className="mt-3 flex gap-2">
                <select
                    aria-label={text("saved_recipe_select")}
                    className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
                    value={selectedSavedId}
                    onChange={(event) => onSelectedSavedIdChange(event.target.value)}
                    disabled={!storageAvailable || savedRecipes.length === 0}
                >
                    <option value="">{text("select_saved_recipe")}</option>
                    {savedRecipes.map((record) => (
                        <option key={record.id} value={record.id}>{record.name}</option>
                    ))}
                </select>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={onLoadRecipe} disabled={!storageAvailable || !selectedSavedId}>
                    <FolderOpen className="h-4 w-4" />
                    {text("load_recipe")}
                </Button>
                <Button variant="outline" size="sm" onClick={onDeleteRecipe} disabled={!storageAvailable || !selectedSavedId}>
                    <Trash2 className="h-4 w-4" />
                    {text("delete_recipe")}
                </Button>
            </div>
            {storageMessage ? <p className="mt-2 text-xs text-muted-foreground">{storageMessage}</p> : null}
        </section>
    )
}
