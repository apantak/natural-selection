import { useEffect, useRef, useState } from 'react'
import { renderShareCard, type ShareCardOptions } from '../../share/shareCard'

interface Rendered {
  blob: Blob
  url: string
  hideNames: boolean
}

export interface ShareCardState {
  blob: Blob | null
  previewUrl: string | null
  failed: boolean
}

export function useShareCard({ results, players, stages, hideNames }: ShareCardOptions, firstDelayMs: number): ShareCardState {
  const [rendered, setRendered] = useState<Rendered | null>(null)
  const [failedFor, setFailedFor] = useState<boolean | null>(null)
  const delay = useRef(firstDelayMs)
  const urlRef = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    },
    [],
  )

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      renderShareCard({ results, players, stages, hideNames }).then(
        (blob) => {
          if (cancelled) return
          if (urlRef.current) URL.revokeObjectURL(urlRef.current)
          const url = URL.createObjectURL(blob)
          urlRef.current = url
          setRendered({ blob, url, hideNames })
        },
        () => {
          if (!cancelled) setFailedFor(hideNames)
        },
      )
    }, delay.current)
    delay.current = 0
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [results, players, stages, hideNames])

  const current = rendered?.hideNames === hideNames
  return {
    blob: current ? rendered.blob : null,
    previewUrl: rendered?.url ?? null,
    failed: !current && failedFor === hideNames,
  }
}
