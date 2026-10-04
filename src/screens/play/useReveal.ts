import { useCallback, useEffect, useState } from 'react'

export const REVEAL_STEP_MS = 700
export const REVEAL_LEAD_MS = 500

export function useReveal(count: number, stepMs = REVEAL_STEP_MS, leadMs = REVEAL_LEAD_MS) {
  const [revealed, setRevealed] = useState(0)
  const done = revealed >= count

  useEffect(() => {
    if (done) return
    const timer = window.setTimeout(() => setRevealed((n) => n + 1), revealed === 0 ? stepMs + leadMs : stepMs)
    return () => window.clearTimeout(timer)
  }, [revealed, done, stepMs, leadMs])

  const next = useCallback(() => setRevealed((n) => Math.min(count, n + 1)), [count])
  const skip = useCallback(() => setRevealed(count), [count])

  return { revealed, done, next, skip }
}
