"use client"

import * as React from "react"
import { Copy, Type, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

const ASCII_CHARS = ["@", "#", "S", "%", "?", "*", "+", ";", ":", ",", "."]

function textToAscii(text: string, font: string): string {
    const fonts: Record<string, Record<string, string[]>> = {
        block: {
            A: ["  █  ", " █ █ ", "█████", "█   █", "█   █"],
            B: ["████ ", "█   █", "████ ", "█   █", "████ "],
            C: [" ████", "█    ", "█    ", "█    ", " ████"],
            D: ["████ ", "█   █", "█   █", "█   █", "████ "],
            E: ["█████", "█    ", "████ ", "█    ", "█████"],
            F: ["█████", "█    ", "████ ", "█    ", "█    "],
            G: [" ████", "█    ", "█  ██", "█   █", " ████"],
            H: ["█   █", "█   █", "█████", "█   █", "█   █"],
            I: ["█████", "  █  ", "  █  ", "  █  ", "█████"],
            J: ["█████", "    █", "    █", "█   █", " ███ "],
            K: ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
            L: ["█    ", "█    ", "█    ", "█    ", "█████"],
            M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
            N: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
            O: [" ███ ", "█   █", "█   █", "█   █", " ███ "],
            P: ["████ ", "█   █", "████ ", "█    ", "█    "],
            Q: [" ███ ", "█   █", "█ █ █", "█  █ ", " ██ █"],
            R: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
            S: [" ████", "█    ", " ███ ", "    █", "████ "],
            T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
            U: ["█   █", "█   █", "█   █", "█   █", " ███ "],
            V: ["█   █", "█   █", "█   █", " █ █ ", "  █  "],
            W: ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
            X: ["█   █", " █ █ ", "  █  ", " █ █ ", "█   █"],
            Y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
            Z: ["█████", "   █ ", "  █  ", " █   ", "█████"],
            " ": ["     ", "     ", "     ", "     ", "     "],
            "0": [" ███ ", "█  ██", "█ █ █", "██  █", " ███ "],
            "1": ["  █  ", " ██  ", "  █  ", "  █  ", "█████"],
            "2": [" ███ ", "█   █", "  ██ ", " █   ", "█████"],
            "3": ["████ ", "    █", " ███ ", "    █", "████ "],
            "4": ["█  █ ", "█  █ ", "█████", "   █ ", "   █ "],
            "5": ["█████", "█    ", "████ ", "    █", "████ "],
            "6": [" ███ ", "█    ", "████ ", "█   █", " ███ "],
            "7": ["█████", "   █ ", "  █  ", " █   ", "█    "],
            "8": [" ███ ", "█   █", " ███ ", "█   █", " ███ "],
            "9": [" ███ ", "█   █", " ████", "    █", " ███ "],
        },
        standard: {} // fallback
    }

    const charMap = fonts[font] || fonts.block
    const upper = text.toUpperCase()
    const lines = ["", "", "", "", ""]

    for (const char of upper) {
        const glyph = charMap[char] || charMap[" "]
        if (glyph) {
            for (let i = 0; i < 5; i++) {
                lines[i] += glyph[i] + " "
            }
        }
    }

    return lines.join("\n")
}

function imageToAscii(canvas: HTMLCanvasElement, width: number): string {
    const ctx = canvas.getContext("2d")
    if (!ctx) return ""
    const aspect = canvas.height / canvas.width
    const height = Math.round(width * aspect * 0.5)

    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext("2d")!
    tempCtx.drawImage(canvas, 0, 0, width, height)

    const imageData = tempCtx.getImageData(0, 0, width, height)
    let result = ""

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4
            const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
            const charIndex = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1))
            result += ASCII_CHARS[ASCII_CHARS.length - 1 - charIndex]
        }
        result += "\n"
    }
    return result
}

export function AsciiArtGeneratorPage() {
    const { t } = useLang()
    const [mode, setMode] = React.useState<"text" | "image">("text")
    const [input, setInput] = React.useState("12345")
    const toolT = t.tools["ascii_art_generator"] as Record<string, string>
    const [output, setOutput] = React.useState("")
    const [asciiWidth, setAsciiWidth] = React.useState(80)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleCopy = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied)
    }

    React.useEffect(() => {
        if (mode === "text" && input.trim()) {
            setOutput(textToAscii(input, "block"))
        }
    }, [input, mode])

    const handleImageUpload = (file: File) => {
        const img = new Image()
        img.onload = () => {
            const canvas = canvasRef.current!
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext("2d")!
            ctx.drawImage(img, 0, 0)
            setOutput(imageToAscii(canvas, asciiWidth))
        }
        img.src = URL.createObjectURL(file)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b px-4 py-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">{toolT.title}</h1>
                        <p className="text-xs text-muted-foreground">{toolT.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-md border bg-muted p-0.5 gap-0.5">
                        <button onClick={() => setMode("text")} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${mode === "text" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>{toolT.text_mode}</button>
                        <button onClick={() => setMode("image")} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${mode === "image" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>{toolT.image_mode}</button>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void handleCopy()} disabled={!output}>
                        <Copy className="h-3.5 w-3.5 mr-1" />{t.common.copy}</Button>
                    <Button variant="outline" size="sm" onClick={() => { setInput(""); setOutput("") }}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex min-h-0">
                <div className="w-[300px] border-r p-4 space-y-4 overflow-auto">
                    {mode === "text" ? (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">{toolT.text_input}</label>
                            <input value={input} onChange={(e) => setInput(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder={toolT.input_placeholder} />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="text-xs font-medium text-muted-foreground">{toolT.image_upload}</label>
                            <button onClick={() => fileInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                                {toolT.drop_text}
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">{(toolT.width).replace("{width}", asciiWidth.toString())}</label>
                                <input type="range" min={40} max={160} value={asciiWidth} onChange={(e) => setAsciiWidth(Number(e.target.value))} className="w-full" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-auto">
                    <div className="tool-pane-header-compact">{toolT.output}</div>
                    <pre className="p-4 font-mono text-[10px] leading-[1.2] text-green-400/90 whitespace-pre overflow-auto">
                        {output || toolT.output_placeholder}
                    </pre>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    )
}
