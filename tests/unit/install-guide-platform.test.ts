import { describe, expect, it } from "vitest"
import { detectInstallGuidePlatform } from "@/features/install-app/install-guide-platform"

describe("install guide platform detection", () => {
    it.each([
        [
            "Android Chrome",
            {
                platform: "Linux armv8l",
                userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/138.0 Mobile Safari/537.36",
            },
            "android",
        ],
        [
            "Android Firefox with an explicit Chrome fallback",
            {
                platform: "Linux armv8l",
                userAgent: "Mozilla/5.0 (Android 15; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0",
            },
            "android",
        ],
        [
            "Android Edge with an explicit Chrome fallback",
            {
                platform: "Linux armv8l",
                userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/138.0 Mobile Safari/537.36 EdgA/138.0",
            },
            "android",
        ],
        [
            "iPhone Safari",
            {
                platform: "iPhone",
                userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1",
            },
            "ios",
        ],
        [
            "iPadOS desktop user agent",
            {
                maxTouchPoints: 5,
                platform: "MacIntel",
                userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.5 Safari/605.1.15",
            },
            "ios",
        ],
        [
            "Edge desktop",
            {
                platform: "Win32",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0 Safari/537.36 Edg/138.0",
            },
            "edge",
        ],
        [
            "Firefox desktop",
            {
                platform: "Linux x86_64",
                userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
            },
            "firefox",
        ],
        [
            "Safari desktop",
            {
                platform: "MacIntel",
                userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.5 Safari/605.1.15",
            },
            "safari_desktop",
        ],
        [
            "Chrome desktop",
            {
                platform: "MacIntel",
                userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/138.0 Safari/537.36",
            },
            "chrome_desktop",
        ],
    ] as const)("selects the %s guide", (_label, signals, expected) => {
        expect(detectInstallGuidePlatform(signals)).toBe(expected)
    })
})
