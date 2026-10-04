import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { dismissInstallHint, shouldShowInstallHint } from '../app/installHint'
import { springUi } from '../theme/motion'
import './InstallHint.css'

export function InstallHint() {
  const [visible, setVisible] = useState(() => shouldShowInstallHint())

  const dismiss = () => {
    dismissInstallHint()
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          className="install-hint card"
          aria-label="Install tip"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12, height: 0, marginTop: 0, padding: 0 }}
          transition={springUi}
        >
          <ShareIcon />
          <p className="install-hint__text">
            Play offline: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
          </p>
          <button type="button" className="install-hint__close" aria-label="Dismiss install tip" onClick={dismiss}>
            <span aria-hidden="true">×</span>
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function ShareIcon() {
  return (
    <svg className="install-hint__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
