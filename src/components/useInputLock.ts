import { useEffect, useState } from 'react'

export const INPUT_LOCK_MS = 400

const UNARMED = Symbol('unarmed')

/**
 * Returns true for `ms` after mount and again for `ms` after `key` changes, so a
 * control that just appeared under the finger cannot take the second tap of a double-tap.
 */
export function useInputLock(key: unknown = null, ms = INPUT_LOCK_MS): boolean {
  const [armedFor, setArmedFor] = useState<unknown>(UNARMED)

  useEffect(() => {
    const timer = window.setTimeout(() => setArmedFor(key), ms)
    return () => window.clearTimeout(timer)
  }, [key, ms])

  return !Object.is(armedFor, key)
}
