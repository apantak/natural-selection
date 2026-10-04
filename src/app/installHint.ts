const STORAGE_KEY = 'wyatb.installHintDismissed'

type NavigatorLike = Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'> & { standalone?: boolean }

export function isIosSafari(nav: NavigatorLike = navigator): boolean {
  const ua = nav.userAgent
  const ios = /iPad|iPhone|iPod/.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)
  return ios && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua)
}

export function isStandalone(nav: NavigatorLike = navigator): boolean {
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true
}

export function shouldShowInstallHint(nav: NavigatorLike = navigator, storage?: Storage): boolean {
  if (!isIosSafari(nav) || isStandalone(nav)) return false
  try {
    return (storage ?? localStorage).getItem(STORAGE_KEY) !== '1'
  } catch {
    return true
  }
}

export function dismissInstallHint(storage?: Storage): void {
  try {
    ;(storage ?? localStorage).setItem(STORAGE_KEY, '1')
  } catch {
    return
  }
}
