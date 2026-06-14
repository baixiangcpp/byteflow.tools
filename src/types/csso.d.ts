declare module "csso" {
  export interface MinifyOptions {
    restructure?: boolean
    forceMediaMerge?: boolean
  }

  export interface MinifyResult {
    css: string
  }

  export function minify(css: string, options?: MinifyOptions): MinifyResult
}
