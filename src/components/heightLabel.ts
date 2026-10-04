/** Formats a standing height for display, e.g. 1.07 becomes "About 1.1 m". */
export function heightLabel(meters: number): string {
  return `About ${meters.toFixed(1)} m`
}
