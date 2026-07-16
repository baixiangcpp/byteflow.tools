import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "qr_code_generator",
    slug: "qr-code-generator",
    inputBehavior: "empty-first",
    category: "generators",
    relatedTools: ["barcode_generator", "image_base64", "url_encode_decode", "svg_to_png_converter"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["qr code generator", "qr code decoder", "scan qr image", "generate qr code online", "qr code maker"],
    searchKeywords: ["decode qr", "read qr code", "qr image scanner", "二维码解析", "QRコード読み取り", "QR 코드 해독"],
} satisfies ToolMeta
