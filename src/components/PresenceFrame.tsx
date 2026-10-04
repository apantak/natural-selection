import type { ComponentProps } from 'react'
import { motion, useIsPresent } from 'motion/react'
import { INPUT_LOCK_MS, useInputLock } from './useInputLock'

export type PresenceFrameProps = ComponentProps<typeof motion.div> & { lockMs?: number }

export function PresenceFrame({ lockMs = INPUT_LOCK_MS, ...rest }: PresenceFrameProps) {
  const isPresent = useIsPresent()
  const locked = useInputLock(null, lockMs)
  return <motion.div data-locked={locked || !isPresent || undefined} {...rest} />
}
