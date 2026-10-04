import data from './stages.json'
import type { Stage } from './types'

export const stages: Stage[] = [...(data as Stage[])].sort((a, b) => a.order - b.order)

export function portraitUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
