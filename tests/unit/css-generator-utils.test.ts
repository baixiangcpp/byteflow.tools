import { describe, expect, it } from "vitest"
import {
    buildBackgroundPatternCss,
    buildCheckboxCss,
    buildClipPathCss,
    buildClipPathValue,
    buildCubicBezierCss,
    buildGlassmorphismCss,
    buildGradientCss,
    buildGradientValue,
    buildLoaderCss,
    buildSwitchCss,
    buildTextGlitchCss,
    buildTriangleCss,
    buildBorderRadiusCss,
    buildBoxShadowCss,
    colorWithAlpha,
    formatCubicBezier,
} from "@/core/utils/css-generator-utils"

describe("css-generator-utils", () => {
    it("builds dots pattern css", () => {
        const css = buildBackgroundPatternCss({
            kind: "dots",
            primaryColor: "#0ea5e9",
            secondaryColor: "#020617",
            size: 20,
        })

        expect(css).toContain("radial-gradient")
        expect(css).toContain("background-size: 20px 20px;")
    })

    it("builds border radius css with ordered corners", () => {
        const css = buildBorderRadiusCss({
            topLeft: 12,
            topRight: 16,
            bottomRight: 20,
            bottomLeft: 24,
            unit: "px",
        })

        expect(css).toBe("border-radius: 12px 16px 20px 24px;")
    })

    it("builds multi-layer box shadow css", () => {
        const css = buildBoxShadowCss([
            { x: 0, y: 8, blur: 24, spread: -12, alpha: 0.32, color: "#0f172a" },
            { x: 0, y: 2, blur: 8, spread: -2, alpha: 0.18, color: "#0ea5e9", inset: true },
        ])

        expect(css).toContain("box-shadow:")
        expect(css).toContain("inset")
        expect(css).toContain("rgba(")
    })

    it("converts hex color to rgba with alpha", () => {
        expect(colorWithAlpha("#ffffff", 0.456)).toBe("rgba(255, 255, 255, 0.46)")
    })

    it("builds checkbox css including checked state", () => {
        const css = buildCheckboxCss({
            size: 24,
            borderWidth: 2,
            borderRadius: 6,
            checkThickness: 2,
            borderColor: "#334155",
            backgroundColor: "#ffffff",
            checkedColor: "#0ea5e9",
            checkColor: "#ffffff",
        })

        expect(css).toContain(".bf-checkbox")
        expect(css).toContain(".bf-checkbox:checked")
        expect(css).toContain("appearance: none;")
    })

    it("builds clip-path values and css", () => {
        const value = buildClipPathValue("hexagon", 10)
        expect(value).toContain("polygon(")
        expect(buildClipPathCss(value)).toBe(`clip-path: ${value};`)
    })

    it("formats cubic bezier and transition css", () => {
        const easing = formatCubicBezier({ x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 })
        expect(easing).toBe("cubic-bezier(0.25, 0.1, 0.25, 1)")
        expect(buildCubicBezierCss({ x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 }, 260)).toContain("transition: transform 260ms")
    })

    it("builds glassmorphism css with blur and backdrop filter", () => {
        const css = buildGlassmorphismCss({
            blur: 22,
            opacity: 0.22,
            borderAlpha: 0.42,
            shadowAlpha: 0.28,
            radius: 20,
            saturation: 140,
            tintColor: "#60a5fa",
        })

        expect(css).toContain("backdrop-filter: blur(22px) saturate(140%);")
        expect(css).toContain("border-radius: 20px;")
        expect(css).toContain("background: rgba(")
    })

    it("builds linear and radial gradient css", () => {
        const linear = buildGradientValue({
            type: "linear",
            angle: 135,
            stops: [
                { color: "#22d3ee", position: 0 },
                { color: "#1d4ed8", position: 55 },
                { color: "#0f172a", position: 100 },
            ],
        })
        const radial = buildGradientCss({
            type: "radial",
            angle: 0,
            stops: [
                { color: "#ffffff", position: 5 },
                { color: "#111827", position: 100 },
            ],
        })

        expect(linear).toContain("linear-gradient(135deg")
        expect(radial).toContain("background: radial-gradient(circle at center")
    })

    it("builds loader css presets", () => {
        const spinner = buildLoaderCss({
            preset: "spinner",
            size: 42,
            color: "#0ea5e9",
            duration: 900,
            thickness: 4,
        })
        const dots = buildLoaderCss({
            preset: "dots",
            size: 36,
            color: "#22d3ee",
            duration: 700,
            thickness: 3,
        })
        const bars = buildLoaderCss({
            preset: "bars",
            size: 44,
            color: "#38bdf8",
            duration: 820,
            thickness: 4,
        })

        expect(spinner).toContain("@keyframes bf-spin")
        expect(dots).toContain("@keyframes bf-dots")
        expect(bars).toContain("@keyframes bf-bars")
    })

    it("builds switch css with on state translation", () => {
        const css = buildSwitchCss({
            width: 52,
            height: 30,
            padding: 3,
            thumbSize: 24,
            radius: 999,
            duration: 220,
            onColor: "#06b6d4",
            offColor: "#334155",
            thumbColor: "#ffffff",
        })

        expect(css).toContain(".bf-switch[data-state=\"on\"]")
        expect(css).toContain("transform: translateX(")
        expect(css).toContain("background: #06b6d4;")
    })

    it("builds glitch text css with keyframes", () => {
        const css = buildTextGlitchCss({
            textColor: "#e2e8f0",
            accentA: "#22d3ee",
            accentB: "#f43f5e",
            intensity: 16,
            duration: 1200,
            skew: 7,
        })

        expect(css).toContain(".bf-glitch::before")
        expect(css).toContain("@keyframes bf-glitch-shift-a")
        expect(css).toContain("text-shadow:")
    })

    it("builds triangle css for all directions", () => {
        const up = buildTriangleCss({ direction: "up", width: 40, height: 24, color: "#22d3ee" })
        const right = buildTriangleCss({ direction: "right", width: 40, height: 24, color: "#22d3ee" })

        expect(up).toContain("border-bottom: 24px solid #22d3ee;")
        expect(right).toContain("border-left: 24px solid #22d3ee;")
    })
})
