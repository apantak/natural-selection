import { useEffect, useRef, type RefObject } from 'react'

const OVERLAY_KEY = 'wyatbOverlay'
const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'

export function isOverlayEntry(): boolean {
  return (history.state as Record<string, unknown> | null)?.[OVERLAY_KEY] === true
}

function trapTab(event: KeyboardEvent, panel: HTMLElement | null) {
  const items = panel ? [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)] : []
  if (items.length === 0) return
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (!panel!.contains(active)) {
    event.preventDefault()
    first.focus()
  } else if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

/**
 * Makes a mounted modal overlay behave like a page: the system back button and Escape close it,
 * Tab stays inside `panelRef`, and focus moves to `initialFocusRef` and returns on close.
 */
export function useOverlay(
  panelRef: RefObject<HTMLElement | null>,
  initialFocusRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const closeRef = useRef(onClose)
  const pendingBack = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    initialFocusRef.current?.focus()
    if (pendingBack.current === undefined) history.pushState({ [OVERLAY_KEY]: true }, '')
    else clearTimeout(pendingBack.current)
    pendingBack.current = undefined
    let popped = false

    const onPopState = () => {
      if (isOverlayEntry()) return
      popped = true
      closeRef.current()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
      else if (event.key === 'Tab') trapTab(event, panelRef.current)
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('keydown', onKeyDown)
      if (!popped && isOverlayEntry()) pendingBack.current = setTimeout(() => history.back())
      previous?.focus?.()
    }
  }, [panelRef, initialFocusRef])
}
