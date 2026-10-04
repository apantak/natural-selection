import type { ReactNode } from 'react'
import './ScreenLayout.css'

export interface ScreenLayoutProps {
  header?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
  centered?: boolean
}

export function ScreenLayout({ header, actions, children, className, centered = false }: ScreenLayoutProps) {
  const classes = ['screen', centered && 'screen--centered', className].filter(Boolean).join(' ')
  return (
    <div className={classes}>
      {header && <header className="screen__header">{header}</header>}
      <main className="screen__body">{children}</main>
      {actions && <footer className="screen__actions">{actions}</footer>}
    </div>
  )
}
