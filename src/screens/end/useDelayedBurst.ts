import { useEffect } from 'react'
import { fireBoneBurst, fireDustBurst, type BurstVariant } from '../../components'

export function useDelayedBurst(variant: BurstVariant, delayMs: number) {
  useEffect(() => {
    const timer = setTimeout(variant === 'bone' ? fireBoneBurst : fireDustBurst, delayMs)
    return () => clearTimeout(timer)
  }, [variant, delayMs])
}
