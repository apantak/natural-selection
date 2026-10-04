import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { springUi } from '../theme/motion'
import { Button } from './Button'
import './ConfirmDialog.css'

export interface ConfirmDialogProps {
  open: boolean
  title: ReactNode
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const messageId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    return () => previous?.focus?.()
  }, [open])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onCancel()
      return
    }
    if (event.key !== 'Tab' || !panelRef.current) return
    const buttons = panelRef.current.querySelectorAll<HTMLButtonElement>('button')
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="dialog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
        >
          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={message ? messageId : undefined}
            className="dialog card"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={springUi}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={onKeyDown}
          >
            <h2 id={titleId} className="dialog__title">
              {title}
            </h2>
            {message && (
              <p id={messageId} className="dialog__message">
                {message}
              </p>
            )}
            <div className="dialog__actions">
              <Button variant={destructive ? 'danger' : 'primary'} size="md" block onClick={onConfirm}>
                {confirmLabel}
              </Button>
              <Button ref={cancelRef} variant="secondary" size="md" block onClick={onCancel}>
                {cancelLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
