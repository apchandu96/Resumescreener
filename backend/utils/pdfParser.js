import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

export async function extractPdfText(buffer) {
  const uint8 = buffer instanceof Uint8Array && !(buffer instanceof Buffer)
    ? buffer
    : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  const loadingTask = pdfjsLib.getDocument({ data: uint8 })
  const pdf = await loadingTask.promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map(it => it.str).join(' ') + '\n'
  }
  return text
}
