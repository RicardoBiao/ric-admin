declare module 'html-docx-js' {
  interface Options {
    orientation?: 'portrait' | 'landscape'
    margins?: { top?: number; right?: number; bottom?: number; left?: number }
  }
  const HTMLDocx: {
    asBlob: (html: string, options?: Options) => Blob
  }
  export default HTMLDocx
}
