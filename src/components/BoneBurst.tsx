import { useEffect } from 'react'
import { fireBoneBurst, fireDustBurst, type BurstVariant } from './bursts'

export interface BoneBurstProps {
  variant?: BurstVariant
  play?: boolean
}

export function BoneBurst({ variant = 'bone', play = true }: BoneBurstProps) {
  useEffect(() => {
    if (!play) return
    if (variant === 'bone') fireBoneBurst()
    else fireDustBurst()
  }, [play, variant])
  return null
}
