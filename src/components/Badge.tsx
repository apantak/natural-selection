import type { ReactNode } from 'react'
import './Badge.css'

export interface BadgeProps {
  children?: ReactNode
  tone?: 'gold' | 'rose'
  label?: string
}

export function Badge({ children = '18+', tone = 'gold', label = 'Adults only' }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`} role="img" title={label} aria-label={label}>
      {children}
    </span>
  )
}
