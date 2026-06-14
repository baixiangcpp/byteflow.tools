import CryptoJS from "crypto-js"

export type StandardHashes = {
    md5: string
    sha1: string
    sha224: string
    sha256: string
    sha384: string
    sha512: string
}

export type StandardHashAlgorithm = keyof StandardHashes

export type HmacHashes = {
    sha256: string
    sha512: string
}

const EMPTY_STANDARD_HASHES: StandardHashes = {
    md5: "",
    sha1: "",
    sha224: "",
    sha256: "",
    sha384: "",
    sha512: "",
}

const EMPTY_HMAC_HASHES: HmacHashes = {
    sha256: "",
    sha512: "",
}

function wordArrayFromBytes(bytes: Uint8Array): CryptoJS.lib.WordArray {
    const words: number[] = []
    for (let index = 0; index < bytes.length; index++) {
        words[index >>> 2] |= bytes[index] << (24 - (index % 4) * 8)
    }
    return CryptoJS.lib.WordArray.create(words, bytes.length)
}

export function emptyStandardHashes(): StandardHashes {
    return { ...EMPTY_STANDARD_HASHES }
}

export function emptyHmacHashes(): HmacHashes {
    return { ...EMPTY_HMAC_HASHES }
}

export function hashText(input: string): StandardHashes {
    if (!input) return emptyStandardHashes()

    return {
        md5: CryptoJS.MD5(input).toString(),
        sha1: CryptoJS.SHA1(input).toString(),
        sha224: CryptoJS.SHA224(input).toString(),
        sha256: CryptoJS.SHA256(input).toString(),
        sha384: CryptoJS.SHA384(input).toString(),
        sha512: CryptoJS.SHA512(input).toString(),
    }
}

export function hashTextByAlgorithm(input: string, algorithm: StandardHashAlgorithm): string {
    const hashes = hashText(input)
    return hashes[algorithm]
}

export function hashBytes(bytes: Uint8Array): StandardHashes {
    if (!bytes.length) return emptyStandardHashes()

    const wordArray = wordArrayFromBytes(bytes)
    return {
        md5: CryptoJS.MD5(wordArray).toString(),
        sha1: CryptoJS.SHA1(wordArray).toString(),
        sha224: CryptoJS.SHA224(wordArray).toString(),
        sha256: CryptoJS.SHA256(wordArray).toString(),
        sha384: CryptoJS.SHA384(wordArray).toString(),
        sha512: CryptoJS.SHA512(wordArray).toString(),
    }
}

export function hashHmac(input: string, secret: string): HmacHashes {
    if (!input || !secret) return emptyHmacHashes()

    return {
        sha256: CryptoJS.HmacSHA256(input, secret).toString(),
        sha512: CryptoJS.HmacSHA512(input, secret).toString(),
    }
}
