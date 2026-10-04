import { isStandalone } from '../app/installHint'

export type ShareResult = 'shared' | 'downloaded' | 'cancelled' | 'unsupported'

export const SHARE_TITLE = 'Will You Accept This Bone?'
export const SHARE_TEXT = 'How far back would you go? Our results from Will You Accept This Bone?'

type ShareNavigator = Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'> & {
  standalone?: boolean
  canShare?: (data?: ShareData) => boolean
  share?: (data?: ShareData) => Promise<void>
}

export interface ShareEnv {
  nav: ShareNavigator
  download: (blob: Blob, filename: string) => void
}

export function isInstalledIosApp(nav: ShareNavigator): boolean {
  const ios = /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)
  return ios && isStandalone(nav)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

function isAbort(error: unknown): boolean {
  return (error as { name?: string } | null)?.name === 'AbortError'
}

function fallback(blob: Blob, filename: string, env: ShareEnv): ShareResult {
  if (isInstalledIosApp(env.nav)) return 'unsupported'
  env.download(blob, filename)
  return 'downloaded'
}

export function shareImage(
  blob: Blob,
  filename: string,
  env: ShareEnv = { nav: navigator, download: downloadBlob },
): Promise<ShareResult> {
  const files = [new File([blob], filename, { type: blob.type || 'image/png' })]
  let canShareFiles = false
  try {
    canShareFiles = env.nav.canShare?.({ files }) === true && typeof env.nav.share === 'function'
  } catch {
    canShareFiles = false
  }
  if (!canShareFiles) return Promise.resolve(fallback(blob, filename, env))
  return env.nav.share!({ files, title: SHARE_TITLE, text: SHARE_TEXT }).then(
    (): ShareResult => 'shared',
    (error: unknown): ShareResult => (isAbort(error) ? 'cancelled' : fallback(blob, filename, env)),
  )
}
