import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '../../components'
import { shareImage, type ShareResult } from '../../share/share'
import { SHARE_FILENAME } from '../../share/shareCard'
import { springUi } from '../../theme/motion'

interface SharePanelProps {
  blob: Blob | null
  previewUrl: string | null
  failed: boolean
  hideNames: boolean
  onHideNamesChange: (hide: boolean) => void
}

const NOTES: Partial<Record<ShareResult, string>> = {
  downloaded: 'Card saved. Check your downloads.',
  unsupported: "Sharing isn't available here. Take a screenshot instead.",
}

export function SharePanel({ blob, previewUrl, failed, hideNames, onHideNamesChange }: SharePanelProps) {
  const [note, setNote] = useState<string | null>(null)

  const share = () => {
    if (!blob) return
    setNote(null)
    void shareImage(blob, SHARE_FILENAME).then((result) => setNote(NOTES[result] ?? null))
  }

  const label = failed ? 'Card unavailable' : blob ? 'Share the results' : 'Preparing the card…'

  return (
    <section className="card end-share" aria-labelledby="end-share-title">
      <div className="end-share__top">
        <div className="end-share__preview" aria-hidden="true">
          <AnimatePresence initial={false}>
            {previewUrl && (
              <motion.img
                key={previewUrl}
                src={previewUrl}
                alt=""
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: blob ? 1 : 0.55, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={springUi}
              />
            )}
          </AnimatePresence>
          {!previewUrl && !failed && <span className="end-share__shimmer" />}
        </div>
        <div className="stack-sm end-share__text">
          <h2 id="end-share-title" className="subtitle">
            Take it to the group chat
          </h2>
          <p className="muted small">A portrait card of tonight's results.</p>
          <button
            type="button"
            role="switch"
            aria-checked={hideNames}
            className="end-switch"
            onClick={() => {
              setNote(null)
              onHideNamesChange(!hideNames)
            }}
          >
            <span className="end-switch__track" aria-hidden="true">
              <motion.span className="end-switch__thumb" animate={{ x: hideNames ? 22 : 0 }} transition={springUi} />
            </span>
            <span>Hide names</span>
          </button>
        </div>
      </div>
      <Button variant="secondary" block disabled={!blob} onClick={share}>
        <span aria-hidden="true">📤</span> {label}
      </Button>
      <p className="end-share__note small center" aria-live="polite">
        {failed ? "We couldn't draw the card on this device." : note}
      </p>
    </section>
  )
}
