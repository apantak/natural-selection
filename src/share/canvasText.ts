type Measurer = Pick<CanvasRenderingContext2D, 'font' | 'measureText'>

/** Sets ctx.font to the largest size from `size` down to `minSize` (step 2) at which `text` fits `maxWidth`, and returns that size. */
export function fitFont(ctx: Measurer, text: string, maxWidth: number, size: number, minSize: number, font: (size: number) => string): number {
  let current = size
  ctx.font = font(current)
  while (current > minSize && ctx.measureText(text).width > maxWidth) {
    current = Math.max(minSize, current - 2)
    ctx.font = font(current)
  }
  return current
}

/** Trims `text` with a trailing ellipsis until it fits `maxWidth` in the current ctx.font. */
export function ellipsize(ctx: Measurer, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let chars = [...text]
  while (chars.length > 1 && ctx.measureText(`${chars.join('').trimEnd()}…`).width > maxWidth) chars = chars.slice(0, -1)
  return `${chars.join('').trimEnd()}…`
}

/** Greedy word wrap in the current ctx.font. A single word wider than `maxWidth` gets its own line. */
export function wrapLines(ctx: Measurer, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}
