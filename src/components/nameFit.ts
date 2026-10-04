import type { CSSProperties } from 'react'

/** Inline style that lets CSS shrink a name so its longest word fits without breaking mid-word. */
export function nameFit(name: string): CSSProperties {
  const longest = Math.max(1, ...name.split(/\s+/).map((word) => word.length))
  return { '--name-chars': longest } as CSSProperties
}
