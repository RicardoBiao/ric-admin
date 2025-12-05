declare module 'mammoth/mammoth.browser' {
  export interface ConvertResult {
    value: string
    messages: Array<{ message: string; type?: string }>
  }

  export interface ConvertOptions {
    styleMap?: string[]
    includeDefaultStyleMap?: boolean
    convertImage?: (element: any) => Promise<{ src: string }>
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer },
    options?: ConvertOptions
  ): Promise<ConvertResult>
}

declare module 'mammoth' {
  export * from 'mammoth/mammoth.browser'
}