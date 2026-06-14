import { clampAlpha, clampRgbChannel, parseHexToRgb } from "@/core/utils/color-utils"

export type BackgroundPatternKind = "dots" | "grid" | "diagonal"

export type BackgroundPatternConfig = {
    kind: BackgroundPatternKind
    primaryColor: string
    secondaryColor: string
    size: number
}

export type BorderRadiusConfig = {
    topLeft: number
    topRight: number
    bottomRight: number
    bottomLeft: number
    unit: "%" | "px"
}

export type BoxShadowLayer = {
    x: number
    y: number
    blur: number
    spread: number
    alpha: number
    color: string
    inset?: boolean
}

export type CheckboxStyleConfig = {
    size: number
    borderWidth: number
    borderRadius: number
    checkThickness: number
    borderColor: string
    backgroundColor: string
    checkedColor: string
    checkColor: string
}

export type ClipPathPreset = "triangle" | "hexagon" | "diamond" | "chevron"

export type CubicBezierConfig = {
    x1: number
    y1: number
    x2: number
    y2: number
}

export type GlassmorphismConfig = {
    blur: number
    opacity: number
    borderAlpha: number
    shadowAlpha: number
    radius: number
    saturation: number
    tintColor: string
    borderColor?: string
}

export type GradientType = "linear" | "radial"

export type GradientStop = {
    color: string
    position: number
}

export type GradientConfig = {
    type: GradientType
    angle: number
    stops: GradientStop[]
}

export type LoaderPreset = "spinner" | "dots" | "bars"

export type LoaderConfig = {
    preset: LoaderPreset
    size: number
    color: string
    duration: number
    thickness: number
}

export type SwitchConfig = {
    width: number
    height: number
    padding: number
    thumbSize: number
    radius: number
    duration: number
    onColor: string
    offColor: string
    thumbColor: string
}

export type TextGlitchConfig = {
    textColor: string
    accentA: string
    accentB: string
    intensity: number
    duration: number
    skew: number
}

export type TriangleDirection = "up" | "down" | "left" | "right"

export type TriangleConfig = {
    direction: TriangleDirection
    width: number
    height: number
    color: string
}

function normalizeSize(size: number): number {
    if (!Number.isFinite(size)) return 24
    return Math.max(4, Math.round(size))
}

function normalizeInset(inset: number): number {
    if (!Number.isFinite(inset)) return 0
    return Math.max(0, Math.min(40, Math.round(inset)))
}

function clampBezierPoint(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(-1, Math.min(2, value))
}

function clampPercentage(value: number, min = 0, max = 100): number {
    if (!Number.isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
}

function formatNumber(value: number): string {
    return Number(value.toFixed(2)).toString()
}

function normalizeGradientStops(stops: GradientStop[]): GradientStop[] {
    const fallback: GradientStop[] = [
        { color: "#22d3ee", position: 0 },
        { color: "#0f172a", position: 100 },
    ]
    if (stops.length < 2) return fallback

    return stops
        .map((stop) => ({
            color: stop.color || "#22d3ee",
            position: Math.round(clampPercentage(stop.position)),
        }))
        .sort((a, b) => a.position - b.position)
}

export function colorWithAlpha(hex: string, alpha: number): string {
    const rgb = parseHexToRgb(hex) ?? { r: 15, g: 23, b: 42 }
    return `rgba(${clampRgbChannel(rgb.r)}, ${clampRgbChannel(rgb.g)}, ${clampRgbChannel(rgb.b)}, ${clampAlpha(alpha).toFixed(2)})`
}

export function buildBackgroundPatternCss(config: BackgroundPatternConfig): string {
    const size = normalizeSize(config.size)
    const primary = config.primaryColor
    const secondary = config.secondaryColor

    if (config.kind === "dots") {
        return [
            `background-color: ${secondary};`,
            `background-image: radial-gradient(${primary} 1.8px, transparent 1.8px);`,
            `background-size: ${size}px ${size}px;`,
        ].join("\n")
    }

    if (config.kind === "grid") {
        return [
            `background-color: ${secondary};`,
            `background-image: linear-gradient(${primary} 1px, transparent 1px), linear-gradient(90deg, ${primary} 1px, transparent 1px);`,
            `background-size: ${size}px ${size}px;`,
        ].join("\n")
    }

    return [
        `background-color: ${secondary};`,
        `background-image: repeating-linear-gradient(45deg, ${primary}, ${primary} 2px, transparent 2px, transparent ${size}px);`,
    ].join("\n")
}

export function buildBorderRadiusCss(config: BorderRadiusConfig): string {
    const unit = config.unit
    const tl = Math.max(0, Math.round(config.topLeft))
    const tr = Math.max(0, Math.round(config.topRight))
    const br = Math.max(0, Math.round(config.bottomRight))
    const bl = Math.max(0, Math.round(config.bottomLeft))
    return `border-radius: ${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit};`
}

export function buildBoxShadowCss(layers: BoxShadowLayer[]): string {
    const validLayers = layers.length > 0
        ? layers
        : [{ x: 0, y: 12, blur: 28, spread: -8, alpha: 0.25, color: "#0f172a", inset: false }]

    const formatted = validLayers.map((layer) => {
        const inset = layer.inset ? "inset " : ""
        const color = colorWithAlpha(layer.color, layer.alpha)
        return `${inset}${Math.round(layer.x)}px ${Math.round(layer.y)}px ${Math.round(layer.blur)}px ${Math.round(layer.spread)}px ${color}`
    })

    return `box-shadow: ${formatted.join(", ")};`
}

export function buildCheckboxCss(config: CheckboxStyleConfig): string {
    const size = Math.max(12, Math.round(config.size))
    const borderWidth = Math.max(1, Math.round(config.borderWidth))
    const borderRadius = Math.max(0, Math.round(config.borderRadius))
    const checkThickness = Math.max(1, Math.round(config.checkThickness))

    return [
        ".bf-checkbox {",
        "  appearance: none;",
        `  width: ${size}px;`,
        `  height: ${size}px;`,
        `  border: ${borderWidth}px solid ${config.borderColor};`,
        `  border-radius: ${borderRadius}px;`,
        `  background: ${config.backgroundColor};`,
        "  position: relative;",
        "  cursor: pointer;",
        "  transition: all 180ms ease;",
        "}",
        ".bf-checkbox:checked {",
        `  background: ${config.checkedColor};`,
        `  border-color: ${config.checkedColor};`,
        "}",
        ".bf-checkbox::after {",
        "  content: \"\";",
        "  position: absolute;",
        "  left: 50%;",
        "  top: 46%;",
        `  width: ${Math.max(4, Math.round(size * 0.24))}px;`,
        `  height: ${Math.max(8, Math.round(size * 0.5))}px;`,
        `  border: solid ${config.checkColor};`,
        `  border-width: 0 ${checkThickness}px ${checkThickness}px 0;`,
        "  transform: translate(-50%, -50%) rotate(45deg) scale(0);",
        "  transform-origin: center;",
        "  transition: transform 150ms ease;",
        "}",
        ".bf-checkbox:checked::after {",
        "  transform: translate(-50%, -50%) rotate(45deg) scale(1);",
        "}",
    ].join("\n")
}

export function buildClipPathValue(preset: ClipPathPreset, inset: number): string {
    const safeInset = normalizeInset(inset)

    if (preset === "triangle") {
        return `polygon(50% ${safeInset}%, ${100 - safeInset}% ${100 - safeInset}%, ${safeInset}% ${100 - safeInset}%)`
    }

    if (preset === "hexagon") {
        const shoulder = 24 + Math.round(safeInset * 0.4)
        const end = 100 - shoulder
        return `polygon(${shoulder}% ${safeInset}%, ${end}% ${safeInset}%, ${100 - safeInset}% 50%, ${end}% ${100 - safeInset}%, ${shoulder}% ${100 - safeInset}%, ${safeInset}% 50%)`
    }

    if (preset === "diamond") {
        return `polygon(50% ${safeInset}%, ${100 - safeInset}% 50%, 50% ${100 - safeInset}%, ${safeInset}% 50%)`
    }

    return `polygon(${safeInset}% ${safeInset}%, ${100 - safeInset}% ${safeInset}%, ${100 - safeInset}% 38%, ${100 - Math.round(safeInset * 0.9)}% 50%, ${100 - safeInset}% ${100 - safeInset}%, ${safeInset}% ${100 - safeInset}%, ${safeInset}% 62%, ${Math.round(safeInset * 0.9)}% 50%, ${safeInset}% 38%)`
}

export function buildClipPathCss(clipPathValue: string): string {
    return `clip-path: ${clipPathValue};`
}

export function formatCubicBezier(config: CubicBezierConfig): string {
    const x1 = formatNumber(clampBezierPoint(config.x1))
    const y1 = formatNumber(clampBezierPoint(config.y1))
    const x2 = formatNumber(clampBezierPoint(config.x2))
    const y2 = formatNumber(clampBezierPoint(config.y2))
    return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`
}

export function buildCubicBezierCss(config: CubicBezierConfig, durationMs: number): string {
    const duration = Math.max(60, Math.round(durationMs))
    return `transition: transform ${duration}ms ${formatCubicBezier(config)};`
}

export function buildGlassmorphismCss(config: GlassmorphismConfig): string {
    const blur = Math.round(clampPercentage(config.blur, 0, 40))
    const opacity = clampAlpha(config.opacity)
    const borderAlpha = clampAlpha(config.borderAlpha)
    const shadowAlpha = clampAlpha(config.shadowAlpha)
    const radius = Math.max(0, Math.round(config.radius))
    const saturation = Math.round(clampPercentage(config.saturation, 70, 220))
    const tintColor = config.tintColor || "#93c5fd"
    const borderBase = config.borderColor || tintColor

    return [
        `background: ${colorWithAlpha(tintColor, opacity)};`,
        `border: 1px solid ${colorWithAlpha(borderBase, borderAlpha)};`,
        `border-radius: ${radius}px;`,
        `backdrop-filter: blur(${blur}px) saturate(${saturation}%);`,
        `-webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);`,
        `box-shadow: 0 18px 45px -26px ${colorWithAlpha("#0f172a", shadowAlpha)};`,
    ].join("\n")
}

export function buildGradientValue(config: GradientConfig): string {
    const stops = normalizeGradientStops(config.stops)
    const points = stops.map((stop) => `${stop.color} ${stop.position}%`).join(", ")

    if (config.type === "radial") {
        return `radial-gradient(circle at center, ${points})`
    }

    const angle = Math.round(clampPercentage(config.angle, 0, 360))
    return `linear-gradient(${angle}deg, ${points})`
}

export function buildGradientCss(config: GradientConfig): string {
    return `background: ${buildGradientValue(config)};`
}

export function buildLoaderCss(config: LoaderConfig): string {
    const size = Math.max(16, Math.round(config.size))
    const duration = Math.max(250, Math.round(config.duration))
    const thickness = Math.max(2, Math.round(config.thickness))
    const color = config.color || "#22d3ee"

    if (config.preset === "dots") {
        const dot = Math.max(4, Math.round(size * 0.2))
        const gap = Math.max(4, Math.round(size * 0.12))

        return [
            ".bf-loader {",
            "  display: inline-flex;",
            `  gap: ${gap}px;`,
            "  align-items: center;",
            "}",
            ".bf-loader span {",
            `  width: ${dot}px;`,
            `  height: ${dot}px;`,
            `  background: ${color};`,
            "  border-radius: 999px;",
            `  animation: bf-dots ${duration}ms ease-in-out infinite;`,
            "}",
            ".bf-loader span:nth-child(2) {",
            `  animation-delay: ${Math.round(duration * 0.15)}ms;`,
            "}",
            ".bf-loader span:nth-child(3) {",
            `  animation-delay: ${Math.round(duration * 0.3)}ms;`,
            "}",
            "@keyframes bf-dots {",
            "  0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }",
            "  40% { transform: scale(1); opacity: 1; }",
            "}",
        ].join("\n")
    }

    if (config.preset === "bars") {
        const barWidth = Math.max(3, Math.round(size * 0.12))
        const barHeight = Math.max(20, Math.round(size * 0.9))
        const gap = Math.max(3, Math.round(size * 0.09))

        return [
            ".bf-loader {",
            "  display: inline-flex;",
            "  align-items: flex-end;",
            `  gap: ${gap}px;`,
            "}",
            ".bf-loader span {",
            `  width: ${barWidth}px;`,
            `  height: ${barHeight}px;`,
            `  background: ${color};`,
            "  border-radius: 999px;",
            "  transform-origin: center bottom;",
            `  animation: bf-bars ${duration}ms ease-in-out infinite;`,
            "}",
            ".bf-loader span:nth-child(2) {",
            `  animation-delay: ${Math.round(duration * 0.12)}ms;`,
            "}",
            ".bf-loader span:nth-child(3) {",
            `  animation-delay: ${Math.round(duration * 0.24)}ms;`,
            "}",
            ".bf-loader span:nth-child(4) {",
            `  animation-delay: ${Math.round(duration * 0.36)}ms;`,
            "}",
            ".bf-loader span:nth-child(5) {",
            `  animation-delay: ${Math.round(duration * 0.48)}ms;`,
            "}",
            "@keyframes bf-bars {",
            "  0%, 100% { transform: scaleY(0.35); opacity: 0.35; }",
            "  50% { transform: scaleY(1); opacity: 1; }",
            "}",
        ].join("\n")
    }

    return [
        ".bf-loader {",
        `  width: ${size}px;`,
        `  height: ${size}px;`,
        `  border: ${thickness}px solid ${colorWithAlpha(color, 0.24)};`,
        `  border-top-color: ${color};`,
        "  border-radius: 999px;",
        `  animation: bf-spin ${duration}ms linear infinite;`,
        "}",
        "@keyframes bf-spin {",
        "  to { transform: rotate(360deg); }",
        "}",
    ].join("\n")
}

export function buildSwitchCss(config: SwitchConfig): string {
    const width = Math.max(32, Math.round(config.width))
    const height = Math.max(18, Math.round(config.height))
    const padding = Math.max(1, Math.round(config.padding))
    const thumbSize = Math.max(8, Math.round(config.thumbSize))
    const radius = Math.max(0, Math.round(config.radius))
    const duration = Math.max(80, Math.round(config.duration))
    const translate = Math.max(0, width - thumbSize - padding * 2)

    return [
        ".bf-switch {",
        "  position: relative;",
        "  display: inline-flex;",
        `  width: ${width}px;`,
        `  height: ${height}px;`,
        `  padding: ${padding}px;`,
        `  border-radius: ${radius}px;`,
        `  background: ${config.offColor};`,
        "  align-items: center;",
        "  cursor: pointer;",
        `  transition: background ${duration}ms ease;`,
        "}",
        ".bf-switch::after {",
        "  content: \"\";",
        `  width: ${thumbSize}px;`,
        `  height: ${thumbSize}px;`,
        `  background: ${config.thumbColor};`,
        "  border-radius: 999px;",
        "  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.25);",
        "  transform: translateX(0);",
        `  transition: transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1);`,
        "}",
        ".bf-switch[data-state=\"on\"] {",
        `  background: ${config.onColor};`,
        "}",
        ".bf-switch[data-state=\"on\"]::after {",
        `  transform: translateX(${translate}px);`,
        "}",
    ].join("\n")
}

export function buildTextGlitchCss(config: TextGlitchConfig): string {
    const intensity = Math.max(0, Math.round(clampPercentage(config.intensity, 0, 28)))
    const duration = Math.max(300, Math.round(config.duration))
    const skew = Math.max(0, Math.round(clampPercentage(config.skew, 0, 20)))

    return [
        ".bf-glitch {",
        "  position: relative;",
        "  display: inline-block;",
        `  color: ${config.textColor};`,
        "  font-weight: 700;",
        "  letter-spacing: 0.04em;",
        `  text-shadow: ${Math.max(1, Math.round(intensity * 0.12))}px 0 ${config.accentA}, -${Math.max(1, Math.round(intensity * 0.12))}px 0 ${config.accentB};`,
        `  animation: bf-glitch-skew ${duration}ms infinite steps(2, end);`,
        "}",
        ".bf-glitch::before, .bf-glitch::after {",
        "  content: attr(data-text);",
        "  position: absolute;",
        "  inset: 0;",
        "}",
        ".bf-glitch::before {",
        `  color: ${config.accentA};`,
        `  transform: translate(${Math.max(1, Math.round(intensity * 0.2))}px, 0);`,
        `  clip-path: inset(0 0 52% 0);`,
        `  animation: bf-glitch-shift-a ${duration}ms infinite linear;`,
        "}",
        ".bf-glitch::after {",
        `  color: ${config.accentB};`,
        `  transform: translate(-${Math.max(1, Math.round(intensity * 0.2))}px, 0);`,
        "  clip-path: inset(48% 0 0 0);",
        `  animation: bf-glitch-shift-b ${duration}ms infinite linear;`,
        "}",
        "@keyframes bf-glitch-shift-a {",
        `  0%, 100% { transform: translate(0, 0) skew(${skew}deg); opacity: 0.78; }`,
        `  20% { transform: translate(${Math.max(1, Math.round(intensity * 0.36))}px, -1px) skew(-${Math.max(1, Math.round(skew * 0.7))}deg); }`,
        `  40% { transform: translate(-${Math.max(1, Math.round(intensity * 0.34))}px, 1px) skew(${Math.max(1, Math.round(skew * 0.8))}deg); }`,
        "  60% { transform: translate(1px, 0) skew(0deg); }",
        "  80% { transform: translate(-1px, 0) skew(0deg); }",
        "}",
        "@keyframes bf-glitch-shift-b {",
        `  0%, 100% { transform: translate(0, 0) skew(-${Math.max(1, Math.round(skew * 0.7))}deg); opacity: 0.75; }`,
        `  25% { transform: translate(-${Math.max(1, Math.round(intensity * 0.38))}px, 1px); }`,
        `  50% { transform: translate(${Math.max(1, Math.round(intensity * 0.3))}px, -1px); }`,
        "  75% { transform: translate(-1px, 0); }",
        "}",
        "@keyframes bf-glitch-skew {",
        "  0%, 100% { transform: skew(0deg); }",
        `  35% { transform: skew(${Math.max(1, Math.round(skew * 0.6))}deg); }`,
        `  70% { transform: skew(-${Math.max(1, Math.round(skew * 0.6))}deg); }`,
        "}",
    ].join("\n")
}

export function buildTriangleCss(config: TriangleConfig): string {
    const width = Math.max(4, Math.round(config.width))
    const height = Math.max(4, Math.round(config.height))
    const halfWidth = Math.max(2, Math.round(width / 2))

    if (config.direction === "up") {
        return `width: 0;\nheight: 0;\nborder-left: ${halfWidth}px solid transparent;\nborder-right: ${halfWidth}px solid transparent;\nborder-bottom: ${height}px solid ${config.color};`
    }

    if (config.direction === "down") {
        return `width: 0;\nheight: 0;\nborder-left: ${halfWidth}px solid transparent;\nborder-right: ${halfWidth}px solid transparent;\nborder-top: ${height}px solid ${config.color};`
    }

    if (config.direction === "left") {
        return `width: 0;\nheight: 0;\nborder-top: ${halfWidth}px solid transparent;\nborder-bottom: ${halfWidth}px solid transparent;\nborder-right: ${height}px solid ${config.color};`
    }

    return `width: 0;\nheight: 0;\nborder-top: ${halfWidth}px solid transparent;\nborder-bottom: ${halfWidth}px solid transparent;\nborder-left: ${height}px solid ${config.color};`
}
